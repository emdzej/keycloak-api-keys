package pl.emdzej.keycloak.apikeys.jpa;

import jakarta.persistence.EntityManager;
import java.util.List;

public class JpaApiKeyRepository implements ApiKeyRepository {
    private final EntityManager em;

    public JpaApiKeyRepository(EntityManager em) {
        this.em = em;
    }

    @Override
    public ApiKeyEntity findById(String id) {
        return em.find(ApiKeyEntity.class, id);
    }

    @Override
    public ApiKeyEntity findByKeyHash(String keyHash) {
        List<ApiKeyEntity> results = em
            .createQuery(
                "select k from ApiKeyEntity k where k.keyHash = :keyHash",
                ApiKeyEntity.class
            )
            .setParameter("keyHash", keyHash)
            .getResultList();
        return results.isEmpty() ? null : results.getFirst();
    }

    @Override
    public List<ApiKeyEntity> findByUserId(String realmId, String userId) {
        return em
            .createQuery(
                "select k from ApiKeyEntity k where k.realmId = :realmId and k.userId = :userId",
                ApiKeyEntity.class
            )
            .setParameter("realmId", realmId)
            .setParameter("userId", userId)
            .getResultList();
    }

    @Override
    public List<ApiKeyEntity> findByClientId(String realmId, String clientId) {
        return em
            .createQuery(
                "select k from ApiKeyEntity k where k.realmId = :realmId and k.clientId = :clientId",
                ApiKeyEntity.class
            )
            .setParameter("realmId", realmId)
            .setParameter("clientId", clientId)
            .getResultList();
    }

    @Override
    public List<ApiKeyEntity> findByRealm(String realmId) {
        return em
            .createQuery(
                "select k from ApiKeyEntity k where k.realmId = :realmId",
                ApiKeyEntity.class
            )
            .setParameter("realmId", realmId)
            .getResultList();
    }

    @Override
    public ApiKeyEntity save(ApiKeyEntity entity) {
        return em.merge(entity);
    }

    @Override
    public void delete(String id) {
        ApiKeyEntity entity = findById(id);
        if (entity == null) {
            return;
        }
        em.remove(entity);
    }
}
