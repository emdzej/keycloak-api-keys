package pl.emdzej.keycloak.apikeys.protocol;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.keycloak.OAuth2Constants;
import org.keycloak.OAuthErrorException;
import org.keycloak.events.Details;
import org.keycloak.events.Errors;
import org.keycloak.events.EventType;
import org.keycloak.models.ClientModel;
import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.oidc.OIDCLoginProtocol;
import org.keycloak.protocol.oidc.TokenManager;
import org.keycloak.representations.AccessToken;
import org.keycloak.representations.AccessTokenResponse;
import org.keycloak.services.CorsErrorResponseException;
import org.keycloak.services.Urls;
import org.keycloak.services.managers.AuthenticationManager;
import org.keycloak.services.managers.AuthenticationSessionManager;
import org.keycloak.services.managers.UserSessionManager;
import org.keycloak.sessions.AuthenticationSessionModel;
import org.keycloak.sessions.RootAuthenticationSessionModel;
import pl.emdzej.keycloak.apikeys.ApiKeyHasher;
import pl.emdzej.keycloak.apikeys.ApiKeyService;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;

public class ApiKeyGrantType extends org.keycloak.protocol.oidc.grants.OAuth2GrantTypeBase {
    public static final String GRANT_TYPE = "urn:ietf:params:oauth:grant-type:api-key";

    @Override
    public Response process(Context context) {
        setContext(context);
        event.detail(Details.AUTH_METHOD, "api_key");

        String apiKeyValue = formParams.getFirst("api_key");
        if (apiKeyValue == null || apiKeyValue.isBlank()) {
            throw invalidGrant("Invalid API key");
        }

        ApiKeyService apiKeyService = new ApiKeyService(session);
        ApiKeyEntity apiKey = apiKeyService.findByKeyHash(ApiKeyHasher.hash(apiKeyValue));
        if (apiKey == null) {
            throw invalidGrant("Invalid API key");
        }
        if (!Objects.equals(apiKey.getRealmId(), realm.getId())) {
            throw invalidGrant("Invalid API key");
        }
        if (apiKey.getRevokedAt() != null) {
            throw invalidGrant("API key revoked");
        }
        if (apiKey.getExpiresAt() != null && apiKey.getExpiresAt().isBefore(Instant.now())) {
            throw invalidGrant("API key expired");
        }

        String clientIdParam = formParams.getFirst(OAuth2Constants.CLIENT_ID);
        if (clientIdParam != null && !clientIdParam.equals(apiKey.getClientId())) {
            throw invalidClient("Client ID does not match API key");
        }
        if (client == null || !client.getClientId().equals(apiKey.getClientId())) {
            throw invalidClient("Client ID does not match API key");
        }

        UserModel user = session.users().getUserById(realm, apiKey.getUserId());
        if (user == null) {
            throw invalidGrant("Invalid API key");
        }
        if (!user.isEnabled()) {
            throw invalidGrant("User disabled");
        }

        event.user(user);
        event.detail(Details.USERNAME, user.getUsername());

        String scope = buildAllowedScope(apiKey, client);

        RootAuthenticationSessionModel rootAuthSession = new AuthenticationSessionManager(session).createAuthenticationSession(realm, false);
        AuthenticationSessionModel authSession = rootAuthSession.createAuthenticationSession(client);

        authSession.setAuthenticatedUser(user);
        authSession.setProtocol(OIDCLoginProtocol.LOGIN_PROTOCOL);
        authSession.setClientNote(OIDCLoginProtocol.ISSUER, Urls.realmIssuer(session.getContext().getUri().getBaseUri(), realm.getName()));
        authSession.setClientNote(OIDCLoginProtocol.SCOPE_PARAM, scope);

        AuthenticationManager.setClientScopesInSession(session, authSession);

        UserSessionModel userSession = new UserSessionManager(session).createUserSession(
            authSession.getParentSession().getId(),
            realm,
            user,
            user.getUsername(),
            clientConnection.getRemoteAddr(),
            "api_key",
            false,
            null,
            null,
            UserSessionModel.SessionPersistenceState.TRANSIENT
        );
        event.session(userSession);

        ClientSessionContext clientSessionCtx = TokenManager.attachAuthenticationSession(session, userSession, authSession);
        updateUserSessionFromClientAuth(userSession);

        TokenManager.AccessTokenResponseBuilder responseBuilder = tokenManager
            .responseBuilder(realm, client, event, session, userSession, clientSessionCtx)
            .generateAccessToken();

        AccessToken accessToken = responseBuilder.getAccessToken();
        accessToken.getOtherClaims().put("api_key_id", apiKey.getId());
        accessToken.setScope(scope);
        restrictRoles(accessToken, apiKey, user, client);

        AccessTokenResponse res = responseBuilder.build();
        res.setScope(scope);
        event.detail(Details.SCOPE, scope);

        apiKey.setLastUsedAt(Instant.now());
        apiKey.setLastUsedIp(clientConnection.getRemoteAddr());
        apiKey.setUsageCount(apiKey.getUsageCount() + 1);
        apiKeyService.save(apiKey);

        event.success();
        return cors.add(Response.ok(res, MediaType.APPLICATION_JSON_TYPE));
    }

    @Override
    public EventType getEventType() {
        return EventType.LOGIN;
    }

    private CorsErrorResponseException invalidGrant(String message) {
        event.detail(Details.REASON, message);
        event.error(Errors.INVALID_GRANT);
        return new CorsErrorResponseException(cors, OAuthErrorException.INVALID_GRANT, message, Response.Status.BAD_REQUEST);
    }

    private CorsErrorResponseException invalidClient(String message) {
        event.detail(Details.REASON, message);
        event.error(Errors.INVALID_CLIENT);
        return new CorsErrorResponseException(cors, OAuthErrorException.INVALID_CLIENT, message, Response.Status.UNAUTHORIZED);
    }

    private String buildAllowedScope(ApiKeyEntity apiKey, ClientModel client) {
        if (apiKey.getScopes().isEmpty()) {
            return "";
        }

        Set<String> allowedScopes = new HashSet<>();
        allowedScopes.addAll(client.getClientScopes(true).keySet());
        allowedScopes.addAll(client.getClientScopes(false).keySet());

        return apiKey.getScopes().stream()
            .filter(allowedScopes::contains)
            .sorted()
            .collect(Collectors.joining(" "));
    }

    private void restrictRoles(AccessToken accessToken, ApiKeyEntity apiKey, UserModel user, ClientModel client) {
        if (apiKey.getRoles().isEmpty()) {
            accessToken.setRealmAccess(null);
            accessToken.setResourceAccess(null);
            return;
        }

        Set<String> allowedRealmRoles = new HashSet<>();
        Set<String> allowedClientRoles = new HashSet<>();

        for (String roleName : apiKey.getRoles()) {
            if (roleName == null || roleName.isBlank()) {
                continue;
            }
            RoleModel role = client.getRole(roleName);
            if (role != null) {
                if (user.hasRole(role)) {
                    allowedClientRoles.add(role.getName());
                }
                continue;
            }
            RoleModel realmRole = realm.getRole(roleName);
            if (realmRole != null && user.hasRole(realmRole)) {
                allowedRealmRoles.add(realmRole.getName());
            }
        }

        if (!allowedRealmRoles.isEmpty()) {
            AccessToken.Access realmAccess = new AccessToken.Access();
            allowedRealmRoles.forEach(realmAccess::addRole);
            accessToken.setRealmAccess(realmAccess);
        } else {
            accessToken.setRealmAccess(null);
        }

        if (!allowedClientRoles.isEmpty()) {
            AccessToken.Access clientAccess = new AccessToken.Access();
            allowedClientRoles.forEach(clientAccess::addRole);
            Map<String, AccessToken.Access> resourceAccess = new HashMap<>();
            resourceAccess.put(client.getClientId(), clientAccess);
            accessToken.setResourceAccess(resourceAccess);
        } else {
            accessToken.setResourceAccess(null);
        }
    }
}
