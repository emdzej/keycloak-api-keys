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
