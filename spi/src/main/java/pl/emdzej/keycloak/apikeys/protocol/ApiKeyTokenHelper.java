package pl.emdzej.keycloak.apikeys.protocol;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.keycloak.models.ClientModel;
import org.keycloak.representations.AccessToken;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;

/**
 * Package-private helper extracted from {@link ApiKeyGrantType} to keep the logic
 * unit-testable without requiring a live Keycloak session.
 */
class ApiKeyTokenHelper {

    private ApiKeyTokenHelper() {}

    /**
     * Builds the scope parameter string to set on the auth session before calling
     * {@code AuthenticationManager.setClientScopesInSession}.
     *
     * <p>Returns {@code null} when the API key has no scope restrictions so Keycloak
     * resolves default scopes normally. Otherwise returns the intersection of the API
     * key's granted scopes with scopes actually configured on the client, preventing
     * escalation to scopes not attached to the client.
     */
    static String buildScopeParam(ApiKeyEntity apiKey, ClientModel client) {
        if (apiKey.getScopes().isEmpty()) {
            return null;
        }

        Set<String> clientScopeNames = new HashSet<>();
        clientScopeNames.addAll(client.getClientScopes(true).keySet());
        clientScopeNames.addAll(client.getClientScopes(false).keySet());

        return apiKey.getScopes().stream()
            .filter(clientScopeNames::contains)
            .sorted()
            .collect(Collectors.joining(" "));
    }

    /**
     * Filters the mapper-produced roles on the access token down to the intersection
     * with the roles the API key was granted.
     *
     * <p>We never add roles — only remove ones that exceed the API key's grant.
     * If the API key has no role grants (empty set), all roles are stripped entirely.
     */
    static void restrictRoles(AccessToken accessToken, ApiKeyEntity apiKey) {
        if (apiKey.getRoles().isEmpty()) {
            accessToken.setRealmAccess(null);
            accessToken.setResourceAccess(null);
            return;
        }

        Set<String> grantedRoles = apiKey.getRoles().stream()
            .filter(r -> r != null && !r.isBlank())
            .collect(Collectors.toSet());

        // Filter realm access
        AccessToken.Access existingRealmAccess = accessToken.getRealmAccess();
        if (existingRealmAccess != null && existingRealmAccess.getRoles() != null) {
            Set<String> filtered = existingRealmAccess.getRoles().stream()
                .filter(grantedRoles::contains)
                .collect(Collectors.toSet());
            if (filtered.isEmpty()) {
                accessToken.setRealmAccess(null);
            } else {
                AccessToken.Access restricted = new AccessToken.Access();
                filtered.forEach(restricted::addRole);
                accessToken.setRealmAccess(restricted);
            }
        }

        // Filter resource (client) access
        Map<String, AccessToken.Access> existingResourceAccess = accessToken.getResourceAccess();
        if (existingResourceAccess != null) {
            Map<String, AccessToken.Access> filteredResourceAccess = new HashMap<>();
            for (Map.Entry<String, AccessToken.Access> entry : existingResourceAccess.entrySet()) {
                if (entry.getValue() == null || entry.getValue().getRoles() == null) continue;
                Set<String> filteredRoles = entry.getValue().getRoles().stream()
                    .filter(grantedRoles::contains)
                    .collect(Collectors.toSet());
                if (!filteredRoles.isEmpty()) {
                    AccessToken.Access restricted = new AccessToken.Access();
                    filteredRoles.forEach(restricted::addRole);
                    filteredResourceAccess.put(entry.getKey(), restricted);
                }
            }
            accessToken.setResourceAccess(filteredResourceAccess.isEmpty() ? null : filteredResourceAccess);
        }
    }
}
