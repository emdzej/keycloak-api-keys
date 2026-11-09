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

package pl.emdzej.keycloak.apikeys;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.keycloak.connections.jpa.JpaConnectionProvider;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.mockito.ArgumentCaptor;
import pl.emdzej.keycloak.apikeys.dto.ApiKeyCreateRequest;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyRepository;

/** Key lifetime defaults and revocation idempotency. */
class ApiKeyServiceLifecycleTest {

    private static final String REALM_ID  = "test-realm";
    private static final String USER_ID   = "user-1";
    private static final String CLIENT_ID = "my-app";

    private ApiKeyRepository repository;
    private ApiKeyService service;
    private RealmModel realm;
    private UserModel user;
    private KeycloakSessionFactory sessionFactory;

    @BeforeEach
    void setUp() throws Exception {
        repository = mock(ApiKeyRepository.class);
        realm      = mock(RealmModel.class);
        user       = mock(UserModel.class);
        ClientModel client = mock(ClientModel.class);
        KeycloakSession session = mock(KeycloakSession.class);
        sessionFactory = mock(KeycloakSessionFactory.class);

        when(realm.getId()).thenReturn(REALM_ID);
        when(realm.getName()).thenReturn("test-realm-name");
        when(user.getId()).thenReturn(USER_ID);
        when(client.getClientId()).thenReturn(CLIENT_ID);
        when(client.isEnabled()).thenReturn(true);
        when(client.isPublicClient()).thenReturn(true);
        when(client.getClientScopes(true)).thenReturn(Map.of());
        when(client.getClientScopes(false)).thenReturn(Map.of());

        KeycloakContext ctx = mock(KeycloakContext.class);
        when(session.getContext()).thenReturn(ctx);
        when(ctx.getRealm()).thenReturn(realm);
        when(ctx.getConnection()).thenReturn(mock(org.keycloak.common.ClientConnection.class));
        when(session.getKeycloakSessionFactory()).thenReturn(sessionFactory);
        // EventBuilder.send() traces through the session's TracingProvider
        when(session.getProvider(org.keycloak.tracing.TracingProvider.class))
            .thenReturn(mock(org.keycloak.tracing.TracingProvider.class, org.mockito.Mockito.RETURNS_DEEP_STUBS));
        org.keycloak.models.ClientProvider clients = mock(org.keycloak.models.ClientProvider.class);
        when(session.clients()).thenReturn(clients);
        when(clients.getClientByClientId(realm, CLIENT_ID)).thenReturn(client);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        JpaConnectionProvider jpa = mock(JpaConnectionProvider.class);
        when(jpa.getEntityManager()).thenReturn(mock(jakarta.persistence.EntityManager.class));
        when(session.getProvider(JpaConnectionProvider.class)).thenReturn(jpa);
        service = new ApiKeyService(session);
        Field repoField = ApiKeyService.class.getDeclaredField("repository");
        repoField.setAccessible(true);
        repoField.set(service, repository);
    }

    @Nested
    class DefaultExpiry {

        @Test
        void keyWithoutExpiryGetsRealmMaxTtlWhenConfigured() {
            when(realm.getAttribute("apiKeysMaxTtlSeconds")).thenReturn("86400");

            Instant before = Instant.now();
            service.createUserKey(realm, user, new ApiKeyCreateRequest("k", CLIENT_ID, null, null, null), user);

            Instant expiresAt = savedEntity().getExpiresAt();
            assertNotNull(expiresAt, "explicit realm max TTL must apply to keys created without expiry");
            long ttl = Duration.between(before, expiresAt).getSeconds();
            assertTrue(ttl >= 86_399 && ttl <= 86_401, "expected ~1 day, was " + ttl + "s");
        }

        @Test
        void keyWithoutExpiryStaysNonExpiringWhenRealmMaxTtlIsNotSet() {
            when(realm.getAttribute("apiKeysMaxTtlSeconds")).thenReturn(null);

            service.createUserKey(realm, user, new ApiKeyCreateRequest("k", CLIENT_ID, null, null, null), user);

            assertNull(savedEntity().getExpiresAt());
        }

        @Test
        void explicitExpiryIsKept() {
            when(realm.getAttribute("apiKeysMaxTtlSeconds")).thenReturn("86400");
            Instant requested = Instant.now().plus(Duration.ofHours(2));

            service.createUserKey(realm, user, new ApiKeyCreateRequest("k", CLIENT_ID, null, null, requested), user);

            assertEquals(requested, savedEntity().getExpiresAt());
        }

        private ApiKeyEntity savedEntity() {
            ArgumentCaptor<ApiKeyEntity> captor = ArgumentCaptor.forClass(ApiKeyEntity.class);
            verify(repository).save(captor.capture());
            return captor.getValue();
        }
    }

    @Nested
    class Revocation {

        @Test
        void revokingAnAlreadyRevokedKeyIsANoOp() {
            Instant originalRevokedAt = Instant.parse("2026-01-01T00:00:00Z");
            ApiKeyEntity entity = new ApiKeyEntity("hash", "myapp_", "k", USER_ID, CLIENT_ID, REALM_ID);
            entity.setRevokedAt(originalRevokedAt);
            when(repository.findById(entity.getId())).thenReturn(entity);

            service.revokeUserKey(realm, user, entity.getId(), user);
            service.revokeKey(realm, entity.getId(), user);

            assertEquals(originalRevokedAt, entity.getRevokedAt(), "revokedAt must not be overwritten");
            verify(repository, never()).save(any());
            verify(sessionFactory, never()).publish(any());
        }

        @Test
        void revokingAnActiveKeyPersistsAndPublishesOnce() {
            ApiKeyEntity entity = new ApiKeyEntity("hash", "myapp_", "k", USER_ID, CLIENT_ID, REALM_ID);
            when(repository.findById(entity.getId())).thenReturn(entity);

            service.revokeKey(realm, entity.getId(), user);

            assertNotNull(entity.getRevokedAt());
            verify(repository).save(entity);
            verify(sessionFactory).publish(any());
        }
    }
}
