package pl.emdzej.keycloak.apikeys.jpa;

import java.util.List;

public interface ApiKeyRepository {
    ApiKeyEntity findById(String id);
    ApiKeyEntity findByKeyHash(String keyHash);
    List<ApiKeyEntity> findByUserId(String realmId, String userId);
    List<ApiKeyEntity> findByClientId(String realmId, String clientId);
    List<ApiKeyEntity> findByRealm(String realmId);
    /** Paginated, server-side filtered query for admin listing (H6-b). */
    List<ApiKeyEntity> findByRealmFiltered(String realmId, String userId, String clientId,
                                           Boolean active, int first, int max);
    /** COUNT query for admin health/stats without loading all rows (H6-b). */
    long countByRealm(String realmId);
    long countActiveByUserAndClient(String realmId, String userId, String clientId);
    ApiKeyEntity save(ApiKeyEntity entity);
    void delete(String id);
}
