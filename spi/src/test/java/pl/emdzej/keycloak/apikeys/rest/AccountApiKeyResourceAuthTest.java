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

package pl.emdzej.keycloak.apikeys.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.persistence.EntityManager;
import jakarta.ws.rs.NotAuthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.keycloak.connections.jpa.JpaConnectionProvider;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.services.managers.AuthenticationManager.AuthResult;
import pl.emdzej.keycloak.apikeys.dto.ApiKeyCreateRequest;

/**
 * Verifies H2: POST and DELETE use bearer-only auth; GET uses bearer + cookie fallback.
 *
 * The test subclasses AccountApiKeyResource and overrides the two protected auth
 * helpers so we can observe which path is taken without standing up a real
 * Keycloak session or HTTP server.
 */
class AccountApiKeyResourceAuthTest {

    enum AuthMethod { BEARER_ONLY, BEARER_WITH_COOKIE_FALLBACK }

    /**
     * Testable subclass that records which auth method was used.
     */
    static class TestableResource extends AccountApiKeyResource {

        private final AuthResult fixedAuthResult;
        AuthMethod lastAuthMethodUsed;
        int bearerOnlyCallCount = 0;
        int bearerWithCookieCallCount = 0;

        TestableResource(KeycloakSession session, AuthResult fixedAuthResult) {
            super(session);
            this.fixedAuthResult = fixedAuthResult;
        }

        @Override
        protected AuthResult authenticateBearer() {
            lastAuthMethodUsed = AuthMethod.BEARER_ONLY;
            bearerOnlyCallCount++;
            if (fixedAuthResult == null) {
                throw new NotAuthorizedException("Bearer");
            }
            return fixedAuthResult;
        }

        @Override
        protected AuthResult authenticate() {
            lastAuthMethodUsed = AuthMethod.BEARER_WITH_COOKIE_FALLBACK;
            bearerWithCookieCallCount++;
            if (fixedAuthResult == null) {
                throw new NotAuthorizedException("Bearer");
            }
            return fixedAuthResult;
        }
    }

    private KeycloakSession session;
    private UserModel user;
    private AuthResult authResult;

    @BeforeEach
    void setUp() {
        session = mock(KeycloakSession.class);
        user = mock(UserModel.class);
        authResult = mock(AuthResult.class);

        // AccountApiKeyResource constructor builds ApiKeyService which needs JPA
        JpaConnectionProvider jpaProvider = mock(JpaConnectionProvider.class);
        EntityManager em = mock(EntityManager.class);
        when(jpaProvider.getEntityManager()).thenReturn(em);
        when(session.getProvider(JpaConnectionProvider.class)).thenReturn(jpaProvider);
        when(session.getProvider(pl.emdzej.keycloak.apikeys.metrics.ApiKeyMetricsProvider.class))
            .thenReturn(null);

        RealmModel realm = mock(RealmModel.class);
        KeycloakContext context = mock(KeycloakContext.class);
        when(session.getContext()).thenReturn(context);
        when(context.getRealm()).thenReturn(realm);

        when(authResult.user()).thenReturn(user);
        when(user.getId()).thenReturn("user-id-1");
    }

    // ── POST uses bearer-only auth (H2) ───────────────────────────────────────

    @Nested
    class PostCreate {

        @Test
        void usesBearerOnlyAuth() {
            TestableResource resource = new TestableResource(session, authResult);
            ApiKeyCreateRequest req = new ApiKeyCreateRequest("Test", "client-1", null, null, null);

            try {
                resource.create(req);
            } catch (Exception ignored) {
                // Service call will fail without full wiring — auth path is what we verify
            }

            assertEquals(AuthMethod.BEARER_ONLY, resource.lastAuthMethodUsed,
                "POST must use bearer-only auth");
            assertEquals(1, resource.bearerOnlyCallCount);
            assertEquals(0, resource.bearerWithCookieCallCount,
                "POST must NOT fall back to cookie auth");
        }

        @Test
        void throwsNotAuthorizedWhenNoBearerToken() {
            TestableResource resource = new TestableResource(session, null);
            ApiKeyCreateRequest req = new ApiKeyCreateRequest("Test", "client-1", null, null, null);

            assertThrows(NotAuthorizedException.class, () -> resource.create(req),
                "POST without bearer token must return 401");
        }
    }

    // ── DELETE uses bearer-only auth (H2) ─────────────────────────────────────

    @Nested
    class DeleteRevoke {

        @Test
        void usesBearerOnlyAuth() {
            TestableResource resource = new TestableResource(session, authResult);

            try {
                resource.revoke("some-key-id");
            } catch (Exception ignored) {
                // Service call will fail without full wiring
            }

            assertEquals(AuthMethod.BEARER_ONLY, resource.lastAuthMethodUsed,
                "DELETE must use bearer-only auth");
            assertEquals(1, resource.bearerOnlyCallCount);
            assertEquals(0, resource.bearerWithCookieCallCount,
                "DELETE must NOT fall back to cookie auth");
        }

        @Test
        void throwsNotAuthorizedWhenNoBearerToken() {
            TestableResource resource = new TestableResource(session, null);

            assertThrows(NotAuthorizedException.class, () -> resource.revoke("some-key-id"),
                "DELETE without bearer token must return 401");
        }
    }

    // ── GET uses bearer + cookie fallback ─────────────────────────────────────

    @Nested
    class GetList {

        @Test
        void usesBearerWithCookieFallback() {
            TestableResource resource = new TestableResource(session, authResult);

            try {
                resource.list();
            } catch (Exception ignored) {
                // Service call will fail without full wiring
            }

            assertEquals(AuthMethod.BEARER_WITH_COOKIE_FALLBACK, resource.lastAuthMethodUsed,
                "GET must use bearer + cookie fallback auth");
            assertEquals(0, resource.bearerOnlyCallCount,
                "GET must NOT use bearer-only path");
            assertEquals(1, resource.bearerWithCookieCallCount);
        }
    }

    // ── Auth method symmetry ───────────────────────────────────────────────────

    @Test
    void postAndDeleteBothUseBearerOnlyNeverCookieFallback() {
        TestableResource resource = new TestableResource(session, authResult);

        try { resource.create(new ApiKeyCreateRequest("n", "c", null, null, null)); } catch (Exception ignored) {}
        try { resource.revoke("k"); } catch (Exception ignored) {}

        assertEquals(2, resource.bearerOnlyCallCount,
            "Both POST and DELETE must each call authenticateBearer exactly once");
        assertEquals(0, resource.bearerWithCookieCallCount,
            "Neither POST nor DELETE should touch cookie fallback");
    }
}
