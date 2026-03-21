/*
 * Copyright (c) 2026 Michał Jaskólski and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package pl.emdzej.keycloak.apikeys.protocol;

import jakarta.persistence.OptimisticLockException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import org.keycloak.OAuth2Constants;
import org.keycloak.OAuthErrorException;
import org.keycloak.events.Details;
import org.keycloak.events.Errors;
import org.keycloak.events.EventType;
import org.keycloak.models.ClientModel;
import org.keycloak.models.ClientSessionContext;
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
import pl.emdzej.keycloak.apikeys.ApiKeyService;
import pl.emdzej.keycloak.apikeys.events.ApiKeyExchangedEvent;
import pl.emdzej.keycloak.apikeys.events.ApiKeyExpiredRejectedEvent;
import pl.emdzej.keycloak.apikeys.events.ApiKeyRateLimitedEvent;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;
import pl.emdzej.keycloak.apikeys.metrics.ApiKeyMetrics;
import pl.emdzej.keycloak.apikeys.metrics.ApiKeyMetricsProvider;
import pl.emdzej.keycloak.apikeys.ratelimit.RateLimitConfig;
import pl.emdzej.keycloak.apikeys.ratelimit.RateLimitConfigResolver;
import pl.emdzej.keycloak.apikeys.ratelimit.RateLimitInfo;
import pl.emdzej.keycloak.apikeys.ratelimit.RateLimiter;
import pl.emdzej.keycloak.apikeys.ratelimit.RateLimiterProvider;

public class ApiKeyGrantType extends org.keycloak.protocol.oidc.grants.OAuth2GrantTypeBase {
    public static final String GRANT_TYPE = "urn:ietf:params:oauth:grant-type:api-key";

    protected static final org.jboss.logging.Logger logger =
        org.jboss.logging.Logger.getLogger(ApiKeyGrantType.class);

    private static final RateLimitConfigResolver RATE_LIMIT_CONFIG_RESOLVER = new RateLimitConfigResolver();

    @Override
    public Response process(Context context) {
        setContext(context);
        event.detail(Details.AUTH_METHOD, "api_key");

        ApiKeyMetrics metrics = resolveMetrics();
        long startNanos = System.nanoTime();

        String apiKeyValue = formParams.getFirst("api_key");
        String clientIdParam = formParams.getFirst(OAuth2Constants.CLIENT_ID);

        if (apiKeyValue == null || apiKeyValue.isBlank()) {
            recordExchange(metrics, clientIdParam, "invalid", startNanos);
            throw invalidGrant("Invalid API key");
        }

        ApiKeyService apiKeyService = new ApiKeyService(session);
        // L3 — use dual-hash lookup (HMAC primary, plain SHA-256 fallback for pre-L3 keys)
        ApiKeyEntity apiKey = apiKeyService.findByKeyValue(apiKeyValue);
        if (apiKey == null) {
            recordExchange(metrics, clientIdParam, "invalid", startNanos);
            throw invalidGrant("Invalid API key");
        }
        if (!Objects.equals(apiKey.getRealmId(), realm.getId())) {
            recordExchange(metrics, clientIdParam, "invalid", startNanos);
            throw invalidGrant("Invalid API key");
        }
        if (apiKey.getRevokedAt() != null) {
            recordExchange(metrics, apiKey.getClientId(), "revoked", startNanos);
            event.detail(Details.REASON, "api_key_revoked");
            throw invalidGrant("Invalid API key or unauthorized");
        }
        if (apiKey.getExpiresAt() != null && apiKey.getExpiresAt().isBefore(Instant.now())) {
            recordExchange(metrics, apiKey.getClientId(), "expired", startNanos);
            event.detail(Details.REASON, "api_key_expired")
                .detail("api_key_event", "API_KEY_EXPIRED_REJECTED")
                .detail("api_key_id", apiKey.getId());
            session.getKeycloakSessionFactory().publish(new ApiKeyExpiredRejectedEvent(
                realm.getId(),
                apiKey.getUserId(),
                apiKey.getClientId(),
                apiKey.getId()
            ));
            throw invalidGrant("Invalid API key or unauthorized");
        }

        if (clientIdParam != null && !clientIdParam.equals(apiKey.getClientId())) {
            recordExchange(metrics, apiKey.getClientId(), "invalid", startNanos);
            event.detail(Details.REASON, "client_id_mismatch");
            throw invalidClient("Invalid API key or unauthorized");
        }
        if (client == null || !client.getClientId().equals(apiKey.getClientId())) {
            recordExchange(metrics, apiKey.getClientId(), "invalid", startNanos);
            event.detail(Details.REASON, "client_id_mismatch");
            throw invalidClient("Invalid API key or unauthorized");
        }

        UserModel user = session.users().getUserById(realm, apiKey.getUserId());
        if (user == null) {
            recordExchange(metrics, apiKey.getClientId(), "invalid", startNanos);
            throw invalidGrant("Invalid API key or unauthorized");
        }
        if (!user.isEnabled()) {
            recordExchange(metrics, apiKey.getClientId(), "invalid", startNanos);
            event.detail(Details.REASON, "user_disabled");
            throw invalidGrant("Invalid API key or unauthorized");
        }

        event.user(user);
        event.detail(Details.USERNAME, user.getUsername());

        RateLimitConfig rateLimitConfig = RATE_LIMIT_CONFIG_RESOLVER.resolve(realm, client, apiKey);
        RateLimiterProvider provider = session.getProvider(RateLimiterProvider.class);
        RateLimiter rateLimiter = provider != null ? provider.getRateLimiter() : null;
        if (rateLimiter == null) {
            recordExchange(metrics, apiKey.getClientId(), "invalid", startNanos);
            throw invalidGrant("Rate limiter unavailable");
        }

        // H4 — fail-closed: if the limiter is unhealthy (FailClosedRateLimiter or any other
        // implementation reporting unhealthy), return 503 rather than silently bypassing limits.
        if (!rateLimiter.isHealthy()) {
            recordExchange(metrics, apiKey.getClientId(), "service_unavailable", startNanos);
            event.detail("api_key_event", "API_KEY_EXCHANGE_UNAVAILABLE")
                .detail("reason", "rate_limiter_unhealthy");
            event.error(Errors.NOT_ALLOWED);
            return cors.add(Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .entity(Map.of(
                    "error", "service_unavailable",
                    "error_description", "Rate limiter unavailable — try again later"))
                .type(MediaType.APPLICATION_JSON_TYPE));
        }

        rateLimiter.updateConfig(apiKey.getId(), rateLimitConfig);
        if (!rateLimiter.tryAcquire(apiKey.getId())) {
            recordExchange(metrics, apiKey.getClientId(), "rate_limited", startNanos);
            recordRateLimited(metrics, apiKey.getClientId());

            event.detail("api_key_event", "API_KEY_RATE_LIMITED")
                .detail("api_key_id", apiKey.getId());
            event.error(Errors.ACCESS_DENIED);
            session.getKeycloakSessionFactory().publish(new ApiKeyRateLimitedEvent(
                realm.getId(),
                apiKey.getUserId(),
                apiKey.getClientId(),
                apiKey.getId(),
                rateLimitConfig.perMinute()
            ));

            RateLimitInfo info = rateLimiter.getInfo(apiKey.getId());
            long now = Instant.now().getEpochSecond();
            long retryAfter = Math.max(1, info.resetAt() - now);
            Map<String, Object> error = Map.of(
                "error", "rate_limit_exceeded",
                "error_description", "API key rate limit exceeded",
                "retry_after", retryAfter
            );
            Response.ResponseBuilder builder = Response.status(429)
                .entity(error)
                .type(MediaType.APPLICATION_JSON_TYPE);
            addRateLimitHeaders(builder, info);
            return cors.add(builder);
        }

        // Compute the scope string to pass into the auth session.
        // This drives setClientScopesInSession → getRequestedClientScopes, which resolves
        // default scopes + any optional scopes the API key was granted, respecting client config.
        // We pass only the scopes the API key is allowed; defaults are always included by Keycloak.
        String scopeParam = ApiKeyTokenHelper.buildScopeParam(apiKey, client);

        RootAuthenticationSessionModel rootAuthSession = new AuthenticationSessionManager(session).createAuthenticationSession(realm, false);
        AuthenticationSessionModel authSession = rootAuthSession.createAuthenticationSession(client);

        authSession.setAuthenticatedUser(user);
        authSession.setProtocol(OIDCLoginProtocol.LOGIN_PROTOCOL);
        authSession.setClientNote(OIDCLoginProtocol.ISSUER, Urls.realmIssuer(session.getContext().getUri().getBaseUri(), realm.getName()));
        // Setting SCOPE_PARAM here feeds into setClientScopesInSession → all protocol mappers
        // for the selected scopes will run, honouring any custom claim mappers on the client.
        authSession.setClientNote(OIDCLoginProtocol.SCOPE_PARAM, scopeParam);

        // Resolves effective scopes (defaults always included, optional only if in scopeParam)
        // and writes them onto the auth session so TokenManager uses them during mapper execution.
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

        // generateAccessToken runs the full mapper pipeline (protocol mappers, role mappers,
        // custom claim mappers) for exactly the scopes resolved above.
        TokenManager.AccessTokenResponseBuilder responseBuilder = tokenManager
            .responseBuilder(realm, client, event, session, userSession, clientSessionCtx)
            .generateAccessToken();

        AccessToken accessToken = responseBuilder.getAccessToken();

        // Tag the token with the API key id — added after mapper execution so no mapper
        // interferes with this claim.
        accessToken.getOtherClaims().put("api_key_id", apiKey.getId());

        // Filter the mapper-produced roles down to only what the API key was granted.
        // We never add roles — we only remove ones the mapper put in that exceed the API key's
        // grant. If the API key has no role restriction, we leave the mapper output intact.
        ApiKeyTokenHelper.restrictRoles(accessToken, apiKey);

        // Use the scope string that Keycloak actually resolved (from clientSessionCtx),
        // not our raw input — this keeps the response consistent with what mappers used.
        String resolvedScope = clientSessionCtx.getScopeString();

        AccessTokenResponse res = responseBuilder.build();

        // M3 — remove the root auth session immediately after the token is built.
        // Auth sessions accumulate under high volume because the TRANSIENT user session
        // is never tracked by the regular session cleanup jobs.
        try {
            session.authenticationSessions().removeRootAuthenticationSession(realm, rootAuthSession);
        } catch (Exception ex) {
            logger.warnf(ex, "Failed to remove auth session %s after api-key exchange",
                rootAuthSession.getId());
        }

        res.setScope(resolvedScope);
        accessToken.setScope(resolvedScope);
        String scope = resolvedScope;
        event.detail(Details.SCOPE, scope);
        event.detail("api_key_event", "API_KEY_EXCHANGED");
        event.detail("api_key_id", apiKey.getId());

        // M2 — re-check revocation immediately before save to close the TOCTOU window.
        // A concurrent revoke that arrived between our initial validity check and now
        // would be caught here by either the explicit re-read or the @Version conflict.
        ApiKeyEntity fresh = apiKeyService.findByKeyHash(apiKey.getKeyHash());
        if (fresh == null || fresh.getRevokedAt() != null) {
            event.detail(Details.REASON, "api_key_revoked_concurrent");
            throw invalidGrant("Invalid API key or unauthorized");
        }

        apiKey.setLastUsedAt(Instant.now());
        apiKey.setLastUsedIp(clientConnection.getRemoteAddr());
        apiKey.setUsageCount(apiKey.getUsageCount() + 1);
        try {
            apiKeyService.save(apiKey);
        } catch (OptimisticLockException e) {
            event.detail(Details.REASON, "api_key_optimistic_lock_conflict");
            throw invalidGrant("Invalid API key or unauthorized");
        }

        recordExchange(metrics, apiKey.getClientId(), "success", startNanos);
        session.getKeycloakSessionFactory().publish(new ApiKeyExchangedEvent(
            realm.getId(),
            apiKey.getUserId(),
            apiKey.getClientId(),
            apiKey.getId(),
            clientConnection.getRemoteAddr()
        ));

        event.success();
        RateLimitInfo info = rateLimiter.getInfo(apiKey.getId());
        Response.ResponseBuilder builder = Response.ok(res, MediaType.APPLICATION_JSON_TYPE);
        addRateLimitHeaders(builder, info);
        return cors.add(builder);
    }

    @Override
    public EventType getEventType() {
        return EventType.OAUTH2_EXTENSION_GRANT;
    }

    protected CorsErrorResponseException invalidGrant(String message) {
        event.detail(Details.REASON, message);
        event.error(Errors.INVALID_TOKEN);
        return new CorsErrorResponseException(cors, OAuthErrorException.INVALID_GRANT, message, Response.Status.BAD_REQUEST);
    }

    protected CorsErrorResponseException invalidClient(String message) {
        event.detail(Details.REASON, message);
        event.error(Errors.INVALID_CLIENT);
        return new CorsErrorResponseException(cors, OAuthErrorException.INVALID_CLIENT, message, Response.Status.UNAUTHORIZED);
    }

    private void addRateLimitHeaders(Response.ResponseBuilder builder, RateLimitInfo info) {
        builder.header("X-RateLimit-Limit", info.limit());
        builder.header("X-RateLimit-Remaining", info.remaining());
        builder.header("X-RateLimit-Reset", info.resetAt());
    }

    private ApiKeyMetrics resolveMetrics() {
        ApiKeyMetricsProvider provider = session.getProvider(ApiKeyMetricsProvider.class);
        return provider != null ? provider.getMetrics() : null;
    }

    private void recordExchange(ApiKeyMetrics metrics, String clientId, String result, long startNanos) {
        if (metrics == null) {
            return;
        }
        long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startNanos);
        String realmName = realm != null ? realm.getName() : "unknown";
        metrics.recordExchange(realmName, clientId, result, durationMs);
    }

    private void recordRateLimited(ApiKeyMetrics metrics, String clientId) {
        if (metrics == null) {
            return;
        }
        String realmName = realm != null ? realm.getName() : "unknown";
        metrics.recordRateLimited(realmName, clientId);
    }
}
