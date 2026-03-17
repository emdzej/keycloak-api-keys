package pl.emdzej.keycloak.apikeys.jpa

import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "api_key")
data class ApiKeyEntity(
    @Id
    val id: String = UUID.randomUUID().toString(),

    @Column(name = "key_hash", nullable = false, unique = true)
    val keyHash: String,

    @Column(name = "key_prefix", nullable = false, length = 16)
    val keyPrefix: String,

    @Column(nullable = false)
    val name: String,

    @Column(name = "user_id", nullable = false)
    val userId: String,

    @Column(name = "client_id", nullable = false)
    val clientId: String,

    @Column(name = "realm_id", nullable = false)
    val realmId: String,

    @ElementCollection
    @CollectionTable(name = "api_key_roles")
    val roles: Set<String> = emptySet(),

    @ElementCollection
    @CollectionTable(name = "api_key_scopes")
    val scopes: Set<String> = emptySet(),

    @Column(name = "expires_at")
    val expiresAt: Instant? = null,

    @Column(name = "revoked_at")
    val revokedAt: Instant? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "last_used_at")
    val lastUsedAt: Instant? = null,

    @Column(name = "last_used_ip")
    val lastUsedIp: String? = null,

    @Column(name = "usage_count")
    val usageCount: Long = 0
) {
    init {
        require(keyHash.isNotBlank()) { "keyHash must not be blank" }
        require(keyPrefix.isNotBlank()) { "keyPrefix must not be blank" }
        require(keyPrefix.length <= 16) { "keyPrefix must be at most 16 characters" }
        require(name.isNotBlank()) { "name must not be blank" }
        require(userId.isNotBlank()) { "userId must not be blank" }
        require(clientId.isNotBlank()) { "clientId must not be blank" }
        require(realmId.isNotBlank()) { "realmId must not be blank" }
    }
}
