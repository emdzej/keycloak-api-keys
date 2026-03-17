package pl.emdzej.keycloak.apikeys.jpa

import jakarta.persistence.EntityManager

class JpaApiKeyRepository(private val em: EntityManager) : ApiKeyRepository {
    override fun findById(id: String): ApiKeyEntity? = em.find(ApiKeyEntity::class.java, id)

    override fun findByKeyHash(keyHash: String): ApiKeyEntity? = em
        .createQuery(
            "select k from ApiKeyEntity k where k.keyHash = :keyHash",
            ApiKeyEntity::class.java
        )
        .setParameter("keyHash", keyHash)
        .resultList
        .firstOrNull()

    override fun findByUserId(realmId: String, userId: String): List<ApiKeyEntity> = em
        .createQuery(
            "select k from ApiKeyEntity k where k.realmId = :realmId and k.userId = :userId",
            ApiKeyEntity::class.java
        )
        .setParameter("realmId", realmId)
        .setParameter("userId", userId)
        .resultList

    override fun findByClientId(realmId: String, clientId: String): List<ApiKeyEntity> = em
        .createQuery(
            "select k from ApiKeyEntity k where k.realmId = :realmId and k.clientId = :clientId",
            ApiKeyEntity::class.java
        )
        .setParameter("realmId", realmId)
        .setParameter("clientId", clientId)
        .resultList

    override fun findByRealm(realmId: String): List<ApiKeyEntity> = em
        .createQuery(
            "select k from ApiKeyEntity k where k.realmId = :realmId",
            ApiKeyEntity::class.java
        )
        .setParameter("realmId", realmId)
        .resultList

    override fun save(entity: ApiKeyEntity): ApiKeyEntity = em.merge(entity)

    override fun delete(id: String) {
        val entity = findById(id) ?: return
        em.remove(entity)
    }
}
