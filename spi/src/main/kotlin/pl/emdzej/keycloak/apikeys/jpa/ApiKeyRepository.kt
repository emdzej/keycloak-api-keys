package pl.emdzej.keycloak.apikeys.jpa

interface ApiKeyRepository {
    fun findById(id: String): ApiKeyEntity?
    fun findByKeyHash(keyHash: String): ApiKeyEntity?
    fun findByUserId(realmId: String, userId: String): List<ApiKeyEntity>
    fun findByClientId(realmId: String, clientId: String): List<ApiKeyEntity>
    fun findByRealm(realmId: String): List<ApiKeyEntity>
    fun save(entity: ApiKeyEntity): ApiKeyEntity
    fun delete(id: String)
}
