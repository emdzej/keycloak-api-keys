package pl.emdzej.keycloak.apikeys.jpa;

import java.util.List;

public interface ApiKeyRepository {
    ApiKeyEntity findById(String id);
    ApiKeyEntity findByKeyHash(String keyHash);
    List<ApiKeyEntity> findByUserId(String realmId, String userId);
    List<ApiKeyEntity> findByClientId(String realmId, String clientId);
    List<ApiKeyEntity> findByRealm(String realmId);
    ApiKeyEntity save(ApiKeyEntity entity);
    void delete(String id);
}
