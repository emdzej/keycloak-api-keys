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
     * with the roles the API key was granted, using fully-qualified role identifiers
     * to prevent name-collision across namespaces (H5).
     *
     * <p>Roles stored in the API key are qualified:
     * <ul>
     *   <li>{@code "realm:<roleName>"} — matched against {@code realmAccess}</li>
     *   <li>{@code "client:<clientId>:<roleName>"} — matched per {@code resourceAccess[clientId]}</li>
     *   <li>Unqualified names (legacy, stored before H5) — matched against both for backward compat</li>
     * </ul>
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

        // Partition grants into realm-scoped, client-scoped, and legacy unqualified
        Set<String> realmGranted = new HashSet<>();
        Map<String, Set<String>> clientGranted = new HashMap<>();
        Set<String> legacyGranted = new HashSet<>(); // backward compat: unqualified names

        for (String r : apiKey.getRoles()) {
            if (r == null || r.isBlank()) continue;
            if (r.startsWith("realm:")) {
                realmGranted.add(r.substring("realm:".length()));
            } else if (r.startsWith("client:")) {
                String[] parts = r.split(":", 3);
                if (parts.length == 3) {
                    clientGranted.computeIfAbsent(parts[1], k -> new HashSet<>()).add(parts[2]);
                }
            } else {
                legacyGranted.add(r); // stored before H5 migration
            }
        }

        // Filter realm access — qualified "realm:" grants + legacy unqualified names
        AccessToken.Access existingRealmAccess = accessToken.getRealmAccess();
        if (existingRealmAccess != null && existingRealmAccess.getRoles() != null) {
            Set<String> filtered = existingRealmAccess.getRoles().stream()
                .filter(role -> realmGranted.contains(role) || legacyGranted.contains(role))
                .collect(Collectors.toSet());
            if (filtered.isEmpty()) {
                accessToken.setRealmAccess(null);
            } else {
                AccessToken.Access restricted = new AccessToken.Access();
                filtered.forEach(restricted::addRole);
                accessToken.setRealmAccess(restricted);
            }
        }

        // Filter resource (client) access — qualified "client:<id>:" grants + legacy names
        Map<String, AccessToken.Access> existingResourceAccess = accessToken.getResourceAccess();
        if (existingResourceAccess != null) {
            Map<String, AccessToken.Access> filteredResourceAccess = new HashMap<>();
            for (Map.Entry<String, AccessToken.Access> entry : existingResourceAccess.entrySet()) {
                String clientId = entry.getKey();
                if (entry.getValue() == null || entry.getValue().getRoles() == null) continue;
                Set<String> allowedForClient = clientGranted.getOrDefault(clientId, Set.of());
                Set<String> filteredRoles = entry.getValue().getRoles().stream()
                    .filter(role -> allowedForClient.contains(role) || legacyGranted.contains(role))
                    .collect(Collectors.toSet());
                if (!filteredRoles.isEmpty()) {
                    AccessToken.Access restricted = new AccessToken.Access();
                    filteredRoles.forEach(restricted::addRole);
                    filteredResourceAccess.put(clientId, restricted);
                }
            }
            accessToken.setResourceAccess(filteredResourceAccess.isEmpty() ? null : filteredResourceAccess);
        }
    }
}
