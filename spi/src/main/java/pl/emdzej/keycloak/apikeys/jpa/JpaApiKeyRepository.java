package pl.emdzej.keycloak.apikeys.jpa;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.ArrayList;
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
    public List<ApiKeyEntity> findByRealmFiltered(String realmId, String userId, String clientId,
                                                  Boolean active, int first, int max) {
        StringBuilder jpql = new StringBuilder(
            "select k from ApiKeyEntity k where k.realmId = :realmId");
        if (userId != null)   jpql.append(" and k.userId = :userId");
        if (clientId != null) jpql.append(" and k.clientId = :clientId");
        if (Boolean.TRUE.equals(active))  jpql.append(" and k.revokedAt is null");
        if (Boolean.FALSE.equals(active)) jpql.append(" and k.revokedAt is not null");
        jpql.append(" order by k.createdAt desc");

        TypedQuery<ApiKeyEntity> query = em.createQuery(jpql.toString(), ApiKeyEntity.class)
            .setParameter("realmId", realmId);
        if (userId != null)   query.setParameter("userId", userId);
        if (clientId != null) query.setParameter("clientId", clientId);
        if (first > 0) query.setFirstResult(first);
        if (max > 0)   query.setMaxResults(max);
        return query.getResultList();
    }

    @Override
    public long countByRealm(String realmId) {
        return em.createQuery(
                "select count(k) from ApiKeyEntity k where k.realmId = :realmId",
                Long.class)
            .setParameter("realmId", realmId)
            .getSingleResult();
    }

    @Override
    public long countActiveByUserAndClient(String realmId, String userId, String clientId) {
        return em.createQuery(
                "select count(k) from ApiKeyEntity k " +
                "where k.realmId = :realmId and k.userId = :userId " +
                "and k.clientId = :clientId and k.revokedAt is null",
                Long.class)
            .setParameter("realmId", realmId)
            .setParameter("userId", userId)
            .setParameter("clientId", clientId)
            .getSingleResult();
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
