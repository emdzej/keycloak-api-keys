package pl.emdzej.keycloak.apikeys.jpa;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "api_key")
public class ApiKeyEntity {
    @Id
    @Column(nullable = false)
    private String id;

    @Column(name = "key_hash", nullable = false, unique = true)
    private String keyHash;

    @Column(name = "key_prefix", nullable = false, length = 16)
    private String keyPrefix;

    @Column(nullable = false)
    private String name;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "client_id", nullable = false)
    private String clientId;

    @Column(name = "realm_id", nullable = false)
    private String realmId;

    @ElementCollection
    @CollectionTable(name = "api_key_roles")
    private Set<String> roles = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "api_key_scopes")
    private Set<String> scopes = new HashSet<>();

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "last_used_ip")
    private String lastUsedIp;

    @Column(name = "usage_count")
    private long usageCount;

    protected ApiKeyEntity() {
        // for JPA
    }

    public ApiKeyEntity(String keyHash,
                        String keyPrefix,
                        String name,
                        String userId,
                        String clientId,
                        String realmId) {
        this(UUID.randomUUID().toString(),
            keyHash,
            keyPrefix,
            name,
            userId,
            clientId,
            realmId,
            Set.of(),
            Set.of(),
            null,
            null,
            Instant.now(),
            null,
            null,
            0L);
    }

    public ApiKeyEntity(String id,
                        String keyHash,
                        String keyPrefix,
                        String name,
                        String userId,
                        String clientId,
                        String realmId,
                        Set<String> roles,
                        Set<String> scopes,
                        Instant expiresAt,
                        Instant revokedAt,
                        Instant createdAt,
                        Instant lastUsedAt,
                        String lastUsedIp,
                        long usageCount) {
        validate(keyHash, keyPrefix, name, userId, clientId, realmId);
        this.id = id != null ? id : UUID.randomUUID().toString();
        this.keyHash = keyHash;
        this.keyPrefix = keyPrefix;
        this.name = name;
        this.userId = userId;
        this.clientId = clientId;
        this.realmId = realmId;
        this.roles = roles != null ? new HashSet<>(roles) : new HashSet<>();
        this.scopes = scopes != null ? new HashSet<>(scopes) : new HashSet<>();
        this.expiresAt = expiresAt;
        this.revokedAt = revokedAt;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.lastUsedAt = lastUsedAt;
        this.lastUsedIp = lastUsedIp;
        this.usageCount = usageCount;
    }

    private static void validate(String keyHash,
                                 String keyPrefix,
                                 String name,
                                 String userId,
                                 String clientId,
                                 String realmId) {
        requireNotBlank(keyHash, "keyHash must not be blank");
        requireNotBlank(keyPrefix, "keyPrefix must not be blank");
        if (keyPrefix.length() > 16) {
            throw new IllegalArgumentException("keyPrefix must be at most 16 characters");
        }
        requireNotBlank(name, "name must not be blank");
        requireNotBlank(userId, "userId must not be blank");
        requireNotBlank(clientId, "clientId must not be blank");
        requireNotBlank(realmId, "realmId must not be blank");
    }

    private static void requireNotBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    public String getId() {
        return id;
    }

    public String getKeyHash() {
        return keyHash;
    }

    public String getKeyPrefix() {
        return keyPrefix;
    }

    public String getName() {
        return name;
    }

    public String getUserId() {
        return userId;
    }

    public String getClientId() {
        return clientId;
    }

    public String getRealmId() {
        return realmId;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public Set<String> getScopes() {
        return scopes;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastUsedAt() {
        return lastUsedAt;
    }

    public String getLastUsedIp() {
        return lastUsedIp;
    }

    public long getUsageCount() {
        return usageCount;
    }
}
