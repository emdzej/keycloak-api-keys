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

    public List<ApiKeyEntity> findByRealm(RealmModel realm, String userId, String clientId, Boolean active) {
        return repository.findByRealm(realm.getId()).stream()
            .filter(key -> userId == null || Objects.equals(key.getUserId(), userId))
            .filter(key -> clientId == null || Objects.equals(key.getClientId(), clientId))
            .filter(key -> active == null || (active && key.getRevokedAt() == null) || (!active && key.getRevokedAt() != null))
            .toList();
    }

    public ApiKeyEntity findById(RealmModel realm, String id) {
        ApiKeyEntity entity = repository.findById(id);
        if (entity != null && Objects.equals(entity.getRealmId(), realm.getId())) {
            return entity;
        }
        return null;
    }

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
        return repository.findByRealm(realm.getId()).size();
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
            if (role == null) {
                role = realm.getRole(roleName);
            }
            if (role == null) {
                throw new BadRequestException("Role not found: " + roleName);
            }
            if (!user.hasRole(role)) {
                throw new ForbiddenException("Role not assigned to user: " + roleName);
            }
            validated.add(roleName);
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

    private static void requireNotBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
    }

    public record CreatedApiKey(ApiKeyEntity entity, String plainKey) {
    }
}
