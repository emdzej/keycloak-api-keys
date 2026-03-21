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

package pl.emdzej.keycloak.apikeys.protocol;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.keycloak.representations.AccessToken;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;

/**
 * Tests for ApiKeyTokenHelper.restrictRoles() with qualified role identifiers (H5).
 *
 * Qualified format:
 *   realm:<roleName>          — for realm roles
 *   client:<clientId>:<role>  — for client roles
 *   <roleName>                — legacy unqualified (backward compat)
 */
class ApiKeyTokenHelperQualifiedRolesTest {

    private ApiKeyEntity apiKey(Set<String> roles) {
        ApiKeyEntity e = new ApiKeyEntity("hash", "pfx", "name", "user-1", "client-1", "realm-1");
        e.getRoles().addAll(roles);
        return e;
    }

    private AccessToken tokenWithRealmRoles(String... roles) {
        AccessToken token = new AccessToken();
        AccessToken.Access access = new AccessToken.Access();
        for (String r : roles) access.addRole(r);
        token.setRealmAccess(access);
        return token;
    }

    private AccessToken tokenWithClientRoles(String clientId, String... roles) {
        AccessToken token = new AccessToken();
        AccessToken.Access access = new AccessToken.Access();
        for (String r : roles) access.addRole(r);
        token.setResourceAccess(Map.of(clientId, access));
        return token;
    }

    // ── Qualified realm roles ──────────────────────────────────────────────────

    @Nested
    class QualifiedRealmRoles {

        @Test
        void keepsRealmRoleMatchingQualifiedGrant() {
            ApiKeyEntity key = apiKey(Set.of("realm:admin"));
            AccessToken token = tokenWithRealmRoles("admin", "user");

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertNotNull(token.getRealmAccess());
            assertEquals(Set.of("admin"), token.getRealmAccess().getRoles());
        }

        @Test
        void stripsRealmRoleNotInQualifiedGrant() {
            ApiKeyEntity key = apiKey(Set.of("realm:user"));
            AccessToken token = tokenWithRealmRoles("admin", "user", "auditor");

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertEquals(Set.of("user"), token.getRealmAccess().getRoles());
        }

        @Test
        void setsRealmAccessNullWhenNoQualifiedRealmGrantMatches() {
            ApiKeyEntity key = apiKey(Set.of("realm:nonexistent"));
            AccessToken token = tokenWithRealmRoles("admin", "user");

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertNull(token.getRealmAccess());
        }

        @Test
        void qualifiedClientGrantDoesNotAffectRealmAccess() {
            // A client: grant must not accidentally allow realm roles of the same name
            ApiKeyEntity key = apiKey(Set.of("client:my-app:admin"));
            AccessToken token = tokenWithRealmRoles("admin");

            ApiKeyTokenHelper.restrictRoles(token, key);

            // realm "admin" must be stripped — only client:my-app:admin is granted
            assertNull(token.getRealmAccess(),
                "client-scoped grant must not bleed into realm role filtering");
        }
    }

    // ── Qualified client roles ─────────────────────────────────────────────────

    @Nested
    class QualifiedClientRoles {

        @Test
        void keepsClientRoleMatchingQualifiedGrant() {
            ApiKeyEntity key = apiKey(Set.of("client:my-app:read"));
            AccessToken token = tokenWithClientRoles("my-app", "read", "write", "admin");

            ApiKeyTokenHelper.restrictRoles(token, key);

            AccessToken.Access access = token.getResourceAccess().get("my-app");
            assertNotNull(access);
            assertEquals(Set.of("read"), access.getRoles());
        }

        @Test
        void stripsClientRolesForOtherClients() {
            // Grant is for my-app only; other-app's roles must be entirely removed
            ApiKeyEntity key = apiKey(Set.of("client:my-app:read"));
            AccessToken token = new AccessToken();
            AccessToken.Access myApp = new AccessToken.Access();
            myApp.addRole("read");
            AccessToken.Access otherApp = new AccessToken.Access();
            otherApp.addRole("admin");
            token.setResourceAccess(Map.of("my-app", myApp, "other-app", otherApp));

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertNotNull(token.getResourceAccess().get("my-app"));
            assertNull(token.getResourceAccess().get("other-app"),
                "other-app must be stripped — no grant exists for it");
        }

        @Test
        void qualifiedRealmGrantDoesNotAffectClientAccess() {
            // A realm: grant must not accidentally allow client roles of the same name
            ApiKeyEntity key = apiKey(Set.of("realm:admin"));
            AccessToken token = tokenWithClientRoles("my-app", "admin");

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertTrue(token.getResourceAccess().isEmpty(),
                "realm-scoped grant must not bleed into client role filtering");
        }

        @Test
        void multipleClientGrantsFilteredIndependently() {
            ApiKeyEntity key = apiKey(Set.of("client:app-a:read", "client:app-b:write"));
            AccessToken token = new AccessToken();
            AccessToken.Access appA = new AccessToken.Access();
            appA.addRole("read");
            appA.addRole("delete"); // not granted
            AccessToken.Access appB = new AccessToken.Access();
            appB.addRole("write");
            appB.addRole("admin"); // not granted
            token.setResourceAccess(Map.of("app-a", appA, "app-b", appB));

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertEquals(Set.of("read"), token.getResourceAccess().get("app-a").getRoles());
            assertEquals(Set.of("write"), token.getResourceAccess().get("app-b").getRoles());
        }
    }

    // ── Mixed realm + client qualified grants ─────────────────────────────────

    @Nested
    class MixedQualifiedGrants {

        @Test
        void filtersBothRealmAndClientGrantsSimultaneously() {
            ApiKeyEntity key = apiKey(Set.of("realm:user", "client:svc:read"));
            AccessToken token = new AccessToken();

            AccessToken.Access realmAccess = new AccessToken.Access();
            realmAccess.addRole("user");
            realmAccess.addRole("admin"); // not granted
            token.setRealmAccess(realmAccess);

            AccessToken.Access svcAccess = new AccessToken.Access();
            svcAccess.addRole("read");
            svcAccess.addRole("write"); // not granted
            token.setResourceAccess(Map.of("svc", svcAccess));

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertEquals(Set.of("user"), token.getRealmAccess().getRoles());
            assertEquals(Set.of("read"), token.getResourceAccess().get("svc").getRoles());
        }
    }

    // ── Legacy backward compatibility (unqualified names stored before H5) ─────

    @Nested
    class LegacyUnqualifiedRoles {

        @Test
        void legacyRealmRoleStillAllowedThroughFallback() {
            // Pre-H5 keys stored plain "admin"; must still work after migration
            ApiKeyEntity key = apiKey(Set.of("admin"));
            AccessToken token = tokenWithRealmRoles("admin", "user");

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertNotNull(token.getRealmAccess());
            assertEquals(Set.of("admin"), token.getRealmAccess().getRoles());
        }

        @Test
        void legacyClientRoleStillAllowedThroughFallback() {
            ApiKeyEntity key = apiKey(Set.of("read"));
            AccessToken token = tokenWithClientRoles("my-app", "read", "write");

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertEquals(Set.of("read"), token.getResourceAccess().get("my-app").getRoles());
        }
    }
}
