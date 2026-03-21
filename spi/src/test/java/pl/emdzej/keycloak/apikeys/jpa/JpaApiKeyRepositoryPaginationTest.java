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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Tests for H6-b: paginated and server-side filtered queries in JpaApiKeyRepository.
 */
class JpaApiKeyRepositoryPaginationTest {

    private EntityManager em;
    private JpaApiKeyRepository repository;

    @BeforeEach
    void setUp() {
        em = mock(EntityManager.class);
        repository = new JpaApiKeyRepository(em);
    }

    // ── countByRealm uses COUNT query, not findAll().size() ───────────────────

    @Nested
    class CountByRealm {

        @Test
        void delegatesToCountQuery() {
            @SuppressWarnings("unchecked")
            TypedQuery<Long> query = mock(TypedQuery.class);
            when(em.createQuery(anyString(), eq(Long.class))).thenReturn(query);
            when(query.setParameter(anyString(), any())).thenReturn(query);
            when(query.getSingleResult()).thenReturn(42L);

            long result = repository.countByRealm("realm-1");

            assertEquals(42L, result);
            // verify the query was a SELECT COUNT, not a SELECT + .size()
            verify(em).createQuery(
                org.mockito.ArgumentMatchers.contains("count(k)"), eq(Long.class));
        }
    }

    // ── findByRealmFiltered builds correct JPQL predicates ───────────────────

    @Nested
    class FindByRealmFiltered {

        @SuppressWarnings("unchecked")
        private TypedQuery<ApiKeyEntity> stubQuery(String jpqlFragment) {
            TypedQuery<ApiKeyEntity> query = mock(TypedQuery.class);
            when(em.createQuery(
                org.mockito.ArgumentMatchers.contains(jpqlFragment),
                eq(ApiKeyEntity.class))).thenReturn(query);
            when(query.setParameter(anyString(), any())).thenReturn(query);
            when(query.setFirstResult(anyInt())).thenReturn(query);
            when(query.setMaxResults(anyInt())).thenReturn(query);
            when(query.getResultList()).thenReturn(List.of());
            return query;
        }

        @Test
        void noOptionalFiltersProducesMinimalJpql() {
            @SuppressWarnings("unchecked")
            TypedQuery<ApiKeyEntity> query = mock(TypedQuery.class);
            when(em.createQuery(anyString(), eq(ApiKeyEntity.class))).thenReturn(query);
            when(query.setParameter(anyString(), any())).thenReturn(query);
            when(query.setFirstResult(anyInt())).thenReturn(query);
            when(query.setMaxResults(anyInt())).thenReturn(query);
            when(query.getResultList()).thenReturn(List.of());

            repository.findByRealmFiltered("realm-1", null, null, null, 0, 0);

            // Should only contain realmId predicate, no userId/clientId/active clauses
            verify(em).createQuery(
                org.mockito.ArgumentMatchers.argThat(jpql ->
                    jpql instanceof String s
                    && s.contains("realmId")
                    && !s.contains("userId")
                    && !s.contains("clientId")
                    && !s.contains("revokedAt")),
                eq(ApiKeyEntity.class));
        }

        @Test
        void userIdFilterIncludedWhenProvided() {
            @SuppressWarnings("unchecked")
            TypedQuery<ApiKeyEntity> query = mock(TypedQuery.class);
            when(em.createQuery(anyString(), eq(ApiKeyEntity.class))).thenReturn(query);
            when(query.setParameter(anyString(), any())).thenReturn(query);
            when(query.setFirstResult(anyInt())).thenReturn(query);
            when(query.setMaxResults(anyInt())).thenReturn(query);
            when(query.getResultList()).thenReturn(List.of());

            repository.findByRealmFiltered("realm-1", "user-1", null, null, 0, 0);

            verify(em).createQuery(
                org.mockito.ArgumentMatchers.argThat(jpql ->
                    jpql instanceof String s && s.contains("userId")),
                eq(ApiKeyEntity.class));
            verify(query).setParameter("userId", "user-1");
        }

        @Test
        void activeFilterIncludesRevokedAtIsNullPredicate() {
            @SuppressWarnings("unchecked")
            TypedQuery<ApiKeyEntity> query = mock(TypedQuery.class);
            when(em.createQuery(anyString(), eq(ApiKeyEntity.class))).thenReturn(query);
            when(query.setParameter(anyString(), any())).thenReturn(query);
            when(query.setFirstResult(anyInt())).thenReturn(query);
            when(query.setMaxResults(anyInt())).thenReturn(query);
            when(query.getResultList()).thenReturn(List.of());

            repository.findByRealmFiltered("realm-1", null, null, true, 0, 0);

            verify(em).createQuery(
                org.mockito.ArgumentMatchers.argThat(jpql ->
                    jpql instanceof String s
                    && s.contains("revokedAt is null")),
                eq(ApiKeyEntity.class));
        }

        @Test
        void revokedFilterIncludesRevokedAtIsNotNullPredicate() {
            @SuppressWarnings("unchecked")
            TypedQuery<ApiKeyEntity> query = mock(TypedQuery.class);
            when(em.createQuery(anyString(), eq(ApiKeyEntity.class))).thenReturn(query);
            when(query.setParameter(anyString(), any())).thenReturn(query);
            when(query.setFirstResult(anyInt())).thenReturn(query);
            when(query.setMaxResults(anyInt())).thenReturn(query);
            when(query.getResultList()).thenReturn(List.of());

            repository.findByRealmFiltered("realm-1", null, null, false, 0, 0);

            verify(em).createQuery(
                org.mockito.ArgumentMatchers.argThat(jpql ->
                    jpql instanceof String s
                    && s.contains("revokedAt is not null")),
                eq(ApiKeyEntity.class));
        }

        @Test
        void paginationParametersSetOnQuery() {
            @SuppressWarnings("unchecked")
            TypedQuery<ApiKeyEntity> query = mock(TypedQuery.class);
            when(em.createQuery(anyString(), eq(ApiKeyEntity.class))).thenReturn(query);
            when(query.setParameter(anyString(), any())).thenReturn(query);
            when(query.setFirstResult(anyInt())).thenReturn(query);
            when(query.setMaxResults(anyInt())).thenReturn(query);
            when(query.getResultList()).thenReturn(List.of());

            repository.findByRealmFiltered("realm-1", null, null, null, 10, 25);

            verify(query).setFirstResult(10);
            verify(query).setMaxResults(25);
        }

        @Test
        void zeroFirstAndMaxSkipsPaginationParameters() {
            @SuppressWarnings("unchecked")
            TypedQuery<ApiKeyEntity> query = mock(TypedQuery.class);
            when(em.createQuery(anyString(), eq(ApiKeyEntity.class))).thenReturn(query);
            when(query.setParameter(anyString(), any())).thenReturn(query);
            when(query.getResultList()).thenReturn(List.of());

            repository.findByRealmFiltered("realm-1", null, null, null, 0, 0);

            // setFirstResult and setMaxResults should NOT be called when both are 0
            verify(query, org.mockito.Mockito.never()).setFirstResult(anyInt());
            verify(query, org.mockito.Mockito.never()).setMaxResults(anyInt());
        }
    }
}
