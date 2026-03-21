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

package pl.emdzej.keycloak.apikeys;

import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.keycloak.events.EventBuilder;
import org.keycloak.events.EventType;
import org.keycloak.connections.jpa.JpaConnectionProvider;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import pl.emdzej.keycloak.apikeys.events.ApiKeyCreatedEvent;
import pl.emdzej.keycloak.apikeys.events.ApiKeyRevokedEvent;
import pl.emdzej.keycloak.apikeys.dto.ApiKeyCreateRequest;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyRepository;
import pl.emdzej.keycloak.apikeys.jpa.JpaApiKeyRepository;
import pl.emdzej.keycloak.apikeys.metrics.ApiKeyMetrics;
import pl.emdzej.keycloak.apikeys.metrics.ApiKeyMetricsProvider;

public class ApiKeyService {
    private static final int MAX_PREFIX_LENGTH = 15;
    private static final int MAX_ACTIVE_KEYS_PER_USER_PER_CLIENT = 25;

    // M1 — input size limits
    static final int MAX_NAME_LENGTH = 100;
    static final int MAX_ROLE_SCOPE_ELEMENT_LENGTH = 100;
    static final int MAX_ROLES_COUNT = 20;
    static final int MAX_SCOPES_COUNT = 20;
    static final long DEFAULT_MAX_TTL_SECONDS = 365L * 24 * 60 * 60; // 1 year

    private final KeycloakSession session;
    private final ApiKeyRepository repository;
    private final ApiKeyMetrics metrics;

    public ApiKeyService(KeycloakSession session) {
        this.session = session;
        this.repository = new JpaApiKeyRepository(
            session.getProvider(JpaConnectionProvider.class).getEntityManager()
        );
        ApiKeyMetricsProvider metricsProvider = session.getProvider(ApiKeyMetricsProvider.class);
        this.metrics = metricsProvider != null ? metricsProvider.getMetrics() : null;
    }

    public List<ApiKeyEntity> listUserKeys(RealmModel realm, UserModel user) {
        return repository.findByUserId(realm.getId(), user.getId())
            .stream()
            .filter(key -> key.getRevokedAt() == null)
            .toList();
    }

    public CreatedApiKey createUserKey(RealmModel realm, UserModel user, ApiKeyCreateRequest request, UserModel createdBy) {
        if (request == null) {
            throw new BadRequestException("Request body is required");
        }
        requireNotBlank(request.getName(), "name is required");
        requireNotBlank(request.getClientId(), "clientId is required");

        // M1 — input size and lifetime validation
        if (request.getName().length() > MAX_NAME_LENGTH) {
            throw new BadRequestException("name must be at most " + MAX_NAME_LENGTH + " characters");
        }
        if (request.getRoles() != null) {
            if (request.getRoles().size() > MAX_ROLES_COUNT) {
                throw new BadRequestException("a key may have at most " + MAX_ROLES_COUNT + " roles");
            }
            for (String r : request.getRoles()) {
                if (r != null && r.length() > MAX_ROLE_SCOPE_ELEMENT_LENGTH) {
                    throw new BadRequestException(
                        "role name exceeds maximum length of " + MAX_ROLE_SCOPE_ELEMENT_LENGTH);
                }
            }
        }
        if (request.getScopes() != null) {
            if (request.getScopes().size() > MAX_SCOPES_COUNT) {
                throw new BadRequestException("a key may have at most " + MAX_SCOPES_COUNT + " scopes");
            }
            for (String s : request.getScopes()) {
                if (s != null && s.length() > MAX_ROLE_SCOPE_ELEMENT_LENGTH) {
                    throw new BadRequestException(
                        "scope name exceeds maximum length of " + MAX_ROLE_SCOPE_ELEMENT_LENGTH);
                }
            }
        }
        if (request.getExpiresAt() != null) {
            Instant now = Instant.now();
            if (!request.getExpiresAt().isAfter(now)) {
                throw new BadRequestException("expiresAt must be in the future");
            }
            long maxTtlSeconds = resolveMaxTtlSeconds(realm);
            if (request.getExpiresAt().isAfter(now.plusSeconds(maxTtlSeconds))) {
                throw new BadRequestException(
                    "expiresAt exceeds the maximum allowed TTL of " + (maxTtlSeconds / 86400) + " days");
            }
        }

        ClientModel client = session.clients().getClientByClientId(realm, request.getClientId());
        if (client == null) {
            throw new NotFoundException("Client not found");
        }
        if (!client.isEnabled()) {
            throw new BadRequestException("Client is disabled");
        }
        if (!userHasClientAccess(user, client)) {
            throw new ForbiddenException("User does not have access to client");
        }

        long activeKeyCount = repository.countActiveByUserAndClient(
            realm.getId(), user.getId(), client.getClientId());
        if (activeKeyCount >= MAX_ACTIVE_KEYS_PER_USER_PER_CLIENT) {
            throw new BadRequestException(
                "Key quota exceeded: maximum " + MAX_ACTIVE_KEYS_PER_USER_PER_CLIENT +
                " active keys per user per client");
        }

        Set<String> roles = validateRoles(realm, client, user, request.getRoles());
        Set<String> scopes = validateScopes(client, request.getScopes());

        String prefix = buildPrefix(client.getClientId());
        ApiKeyHasher.GeneratedKey generatedKey = ApiKeyHasher.generate(prefix);
        String keyPrefix = prefix + "_";

        ApiKeyEntity entity = new ApiKeyEntity(
            null,
            generatedKey.hash(),
            keyPrefix,
            request.getName(),
            user.getId(),
            client.getClientId(),
            realm.getId(),
            roles,
            scopes,
            request.getExpiresAt(),
            null,
            Instant.now(),
            null,
            null,
            0L,
            null
        );

        ApiKeyEntity saved = repository.save(entity);
        updateKeyCounts(realm, saved.getClientId());
        publishCreatedEvent(realm, saved, createdBy);
        return new CreatedApiKey(saved, generatedKey.plainKey());
    }

    public CreatedApiKey createUserKey(RealmModel realm, UserModel user, ApiKeyCreateRequest request) {
        return createUserKey(realm, user, request, user);
    }

    public CreatedApiKey createForUser(RealmModel realm, UserModel user, ApiKeyCreateRequest request, UserModel createdBy) {
        return createUserKey(realm, user, request, createdBy);
    }

    public CreatedApiKey createForUser(RealmModel realm, UserModel user, ApiKeyCreateRequest request) {
        return createUserKey(realm, user, request, user);
    }

    public List<ApiKeyEntity> findByRealm(RealmModel realm, String userId, String clientId,
                                          Boolean active) {
        return repository.findByRealmFiltered(realm.getId(), userId, clientId, active, 0, 0);
    }

    public List<ApiKeyEntity> findByRealm(RealmModel realm, String userId, String clientId,
                                          Boolean active, int first, int max) {
        return repository.findByRealmFiltered(realm.getId(), userId, clientId, active, first, max);
    }

    public ApiKeyEntity findById(RealmModel realm, String id) {
        ApiKeyEntity entity = repository.findById(id);
        if (entity != null && Objects.equals(entity.getRealmId(), realm.getId())) {
            return entity;
        }
        return null;
    }

    /**
     * Looks up a key by its plain-text value using a dual-hash strategy (L3):
     * <ol>
     *   <li>Try HMAC-SHA-256(pepper, key) — the primary path for all keys created after L3.</li>
     *   <li>If not found <em>and</em> a pepper is configured, fall back to plain SHA-256 to
     *       support pre-L3 keys still in the database.  On a match the stored hash is
     *       transparently re-hashed to HMAC so future lookups use the fast path.</li>
     *   <li>If no pepper is configured, only plain SHA-256 is tried (dev / migration mode).</li>
     * </ol>
     */
    public ApiKeyEntity findByKeyValue(String plainKey) {
        byte[] pepper = ApiKeyHasher.resolvePepper();

        // Primary lookup — HMAC when pepper available, plain SHA-256 otherwise
        String primaryHash = ApiKeyHasher.hashForLookup(plainKey, pepper);
        ApiKeyEntity entity = repository.findByKeyHash(primaryHash);
        if (entity != null) {
            return entity;
        }

        // Transition fallback: pepper is set but key was stored with plain SHA-256 (pre-L3)
        if (pepper != null) {
            String legacyHash = ApiKeyHasher.hash(plainKey);
            entity = repository.findByKeyHash(legacyHash);
            if (entity != null) {
                // Re-hash to HMAC transparently — upgrade this key in-place
                entity.setKeyHash(primaryHash);
                repository.save(entity);
                return entity;
            }
        }

        return null;
    }

    /** Direct hash-based lookup used internally (M2 re-check uses the stored hash). */
    public ApiKeyEntity findByKeyHash(String keyHash) {
        return repository.findByKeyHash(keyHash);
    }

    public ApiKeyEntity save(ApiKeyEntity entity) {
        return repository.save(entity);
    }

    public ApiKeyEntity getStats(RealmModel realm, String id) {
        return findById(realm, id);
    }

    public void revokeKey(RealmModel realm, String keyId, UserModel revokedBy) {
        requireNotBlank(keyId, "keyId is required");
        ApiKeyEntity entity = findById(realm, keyId);
        if (entity == null) {
            throw new NotFoundException("API key not found");
        }
        entity.setRevokedAt(Instant.now());
        ApiKeyEntity saved = repository.save(entity);
        updateKeyCounts(realm, saved.getClientId());
        publishRevokedEvent(realm, saved, revokedBy);
    }

    public void revokeKey(RealmModel realm, String keyId) {
        revokeKey(realm, keyId, null);
    }

    public void revokeUserKey(RealmModel realm, UserModel user, String keyId, UserModel revokedBy) {
        requireNotBlank(keyId, "keyId is required");

        ApiKeyEntity entity = repository.findById(keyId);
        if (entity == null || !Objects.equals(entity.getRealmId(), realm.getId())) {
            throw new NotFoundException("API key not found");
        }
        if (!Objects.equals(entity.getUserId(), user.getId())) {
            throw new ForbiddenException("API key does not belong to user");
        }
        entity.setRevokedAt(Instant.now());
        ApiKeyEntity saved = repository.save(entity);
        updateKeyCounts(realm, saved.getClientId());
        publishRevokedEvent(realm, saved, revokedBy);
    }

    public void revokeUserKey(RealmModel realm, UserModel user, String keyId) {
        revokeUserKey(realm, user, keyId, user);
    }

    public long countAll() {
        RealmModel realm = session.getContext().getRealm();
        if (realm == null) {
            return 0L;
        }
        return repository.countByRealm(realm.getId());
    }

    private void updateKeyCounts(RealmModel realm, String clientId) {
        if (metrics == null) {
            return;
        }
        Instant now = Instant.now();
        List<ApiKeyEntity> keys = repository.findByClientId(realm.getId(), clientId);
        long revoked = keys.stream().filter(key -> key.getRevokedAt() != null).count();
        long expired = keys.stream()
            .filter(key -> key.getRevokedAt() == null)
            .filter(key -> key.getExpiresAt() != null && key.getExpiresAt().isBefore(now))
            .count();
        long active = keys.size() - revoked - expired;

        metrics.updateKeyCount(realm.getName(), clientId, "active", active);
        metrics.updateKeyCount(realm.getName(), clientId, "revoked", revoked);
        metrics.updateKeyCount(realm.getName(), clientId, "expired", expired);
    }

    private void publishCreatedEvent(RealmModel realm, ApiKeyEntity entity, UserModel createdBy) {
        String actorId = createdBy != null ? createdBy.getId() : null;
        session.getKeycloakSessionFactory().publish(new ApiKeyCreatedEvent(
            realm.getId(),
            entity.getUserId(),
            entity.getClientId(),
            entity.getId(),
            actorId
        ));

        EventBuilder event = new EventBuilder(realm, session, session.getContext().getConnection())
            .event(EventType.UPDATE_CREDENTIAL)
            .client(entity.getClientId())
            .user(entity.getUserId())
            .detail("api_key_event", "API_KEY_CREATED")
            .detail("api_key_id", entity.getId())
            .detail("client_id", entity.getClientId())
            .detail("created_by", actorId);
        event.success();
    }

    private void publishRevokedEvent(RealmModel realm, ApiKeyEntity entity, UserModel revokedBy) {
        String actorId = revokedBy != null ? revokedBy.getId() : null;
        session.getKeycloakSessionFactory().publish(new ApiKeyRevokedEvent(
            realm.getId(),
            entity.getUserId(),
            entity.getClientId(),
            entity.getId(),
            actorId
        ));

        EventBuilder event = new EventBuilder(realm, session, session.getContext().getConnection())
            .event(EventType.UPDATE_CREDENTIAL)
            .client(entity.getClientId())
            .user(entity.getUserId())
            .detail("api_key_event", "API_KEY_REVOKED")
            .detail("api_key_id", entity.getId())
            .detail("client_id", entity.getClientId())
            .detail("revoked_by", actorId);
        event.success();
    }

    /**
     * Validates requested roles against the realm and client, then stores them as
     * fully-qualified identifiers to prevent name-collision across namespaces (H5):
     * <ul>
     *   <li>Client roles → {@code "client:<clientId>:<roleName>"}</li>
     *   <li>Realm roles  → {@code "realm:<roleName>"}</li>
     * </ul>
     */
    private static Set<String> validateRoles(RealmModel realm,
                                             ClientModel client,
                                             UserModel user,
                                             Collection<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return Set.of();
        }

        Set<String> validated = new HashSet<>();
        for (String roleName : roles) {
            if (roleName == null || roleName.isBlank()) {
                continue;
            }
            RoleModel role = client.getRole(roleName);
            if (role != null) {
                if (!user.hasRole(role)) {
                    throw new ForbiddenException("Role not assigned to user: " + roleName);
                }
                validated.add("client:" + client.getClientId() + ":" + roleName);
                continue;
            }
            role = realm.getRole(roleName);
            if (role != null) {
                if (!user.hasRole(role)) {
                    throw new ForbiddenException("Role not assigned to user: " + roleName);
                }
                validated.add("realm:" + roleName);
                continue;
            }
            throw new BadRequestException("Role not found: " + roleName);
        }
        return validated;
    }

    private static Set<String> validateScopes(ClientModel client, Collection<String> scopes) {
        if (scopes == null || scopes.isEmpty()) {
            return Set.of();
        }

        Set<String> allowedScopes = new HashSet<>();
        allowedScopes.addAll(client.getClientScopes(true).keySet());
        allowedScopes.addAll(client.getClientScopes(false).keySet());

        return scopes.stream()
            .filter(scope -> scope != null && !scope.isBlank())
            .peek(scope -> {
                if (!allowedScopes.contains(scope) && client.getDynamicClientScope(scope) == null) {
                    throw new BadRequestException("Scope not allowed for client: " + scope);
                }
            })
            .collect(Collectors.toSet());
    }

    private static boolean userHasClientAccess(UserModel user, ClientModel client) {
        return user.getClientRoleMappingsStream(client).findAny().isPresent() || client.isPublicClient();
    }

    private static String buildPrefix(String clientId) {
        String sanitized = clientId == null ? "" : clientId.replaceAll("[^a-zA-Z0-9]", "");
        if (sanitized.isBlank()) {
            sanitized = "api";
        }
        if (sanitized.length() > MAX_PREFIX_LENGTH) {
            sanitized = sanitized.substring(0, MAX_PREFIX_LENGTH);
        }
        return sanitized.toLowerCase();
    }

    /**
     * Resolves the maximum allowed key TTL in seconds from the realm attribute
     * {@code apiKeysMaxTtlSeconds}, falling back to {@link #DEFAULT_MAX_TTL_SECONDS}.
     */
    private static long resolveMaxTtlSeconds(RealmModel realm) {
        String attr = realm.getAttribute("apiKeysMaxTtlSeconds");
        if (attr != null && !attr.isBlank()) {
            try {
                long v = Long.parseLong(attr.trim());
                if (v > 0) return v;
            } catch (NumberFormatException ignored) {
                // fall through to default
            }
        }
        return DEFAULT_MAX_TTL_SECONDS;
    }

    private static void requireNotBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
    }

    public record CreatedApiKey(ApiKeyEntity entity, String plainKey) {
    }
}
