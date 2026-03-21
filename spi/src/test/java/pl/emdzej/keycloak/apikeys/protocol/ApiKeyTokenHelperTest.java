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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.keycloak.models.ClientModel;
import org.keycloak.models.ClientScopeModel;
import org.keycloak.representations.AccessToken;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;

class ApiKeyTokenHelperTest {

    // ── helpers ───────────────────────────────────────────────────────────────

    private ApiKeyEntity apiKey(Set<String> scopes, Set<String> roles) {
        ApiKeyEntity e = new ApiKeyEntity("hash", "pfx", "name", "user-1", "client-1", "realm-1");
        e.getScopes().addAll(scopes);
        e.getRoles().addAll(roles);
        return e;
    }

    private ClientModel clientWithScopes(Map<String, ClientScopeModel> defaults,
                                          Map<String, ClientScopeModel> optional) {
        ClientModel client = mock(ClientModel.class);
        when(client.getClientScopes(true)).thenReturn(defaults);
        when(client.getClientScopes(false)).thenReturn(optional);
        return client;
    }

    private static ClientScopeModel scope() {
        return mock(ClientScopeModel.class);
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

    // ── buildScopeParam ───────────────────────────────────────────────────────

    @Nested
    class BuildScopeParam {

        @Test
        void returnsNullWhenApiKeyHasNoScopes() {
            ClientModel client = clientWithScopes(
                Map.of("openid", scope(), "profile", scope()),
                Map.of("email", scope())
            );
            ApiKeyEntity key = apiKey(Set.of(), Set.of());

            assertNull(ApiKeyTokenHelper.buildScopeParam(key, client));
        }

        @Test
        void returnsIntersectionOfApiKeyScopesAndClientScopes() {
            ClientModel client = clientWithScopes(
                Map.of("openid", scope(), "profile", scope()),
                Map.of("email", scope(), "address", scope())
            );
            ApiKeyEntity key = apiKey(Set.of("email", "openid", "unknown-scope"), Set.of());

            String result = ApiKeyTokenHelper.buildScopeParam(key, client);

            assertNotNull(result);
            Set<String> scopes = Set.of(result.split(" "));
            assertTrue(scopes.contains("email"));
            assertTrue(scopes.contains("openid"));
            assertEquals(2, scopes.size(), "unknown-scope must be filtered out");
        }

        @Test
        void returnsEmptyStringWhenApiKeyScopesDoNotMatchClient() {
            ClientModel client = clientWithScopes(
                Map.of("openid", scope()),
                Map.of()
            );
            ApiKeyEntity key = apiKey(Set.of("totally-unknown"), Set.of());

            String result = ApiKeyTokenHelper.buildScopeParam(key, client);
            assertEquals("", result);
        }

        @Test
        void resultIsSortedForConsistency() {
            ClientModel client = clientWithScopes(
                Map.of(),
                Map.of("zebra", scope(), "alpha", scope(), "middle", scope())
            );
            ApiKeyEntity key = apiKey(Set.of("zebra", "alpha", "middle"), Set.of());

            String result = ApiKeyTokenHelper.buildScopeParam(key, client);
            assertEquals("alpha middle zebra", result);
        }
    }

    // ── restrictRoles ─────────────────────────────────────────────────────────

    @Nested
    class RestrictRoles {

        @Test
        void stripsAllRolesWhenApiKeyHasNoRoleGrant() {
            AccessToken token = tokenWithRealmRoles("admin", "user");
            ApiKeyEntity key = apiKey(Set.of(), Set.of());

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertNull(token.getRealmAccess());
            // getResourceAccess() returns emptyMap (never null) per Keycloak's API
            assertTrue(token.getResourceAccess().isEmpty());
        }

        @Test
        void keepsOnlyGrantedRealmRoles() {
            AccessToken token = tokenWithRealmRoles("admin", "user", "auditor");
            ApiKeyEntity key = apiKey(Set.of(), Set.of("user"));

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertNotNull(token.getRealmAccess());
            assertEquals(Set.of("user"), token.getRealmAccess().getRoles());
        }

        @Test
        void setsRealmAccessNullWhenNoGrantedRolesMatch() {
            AccessToken token = tokenWithRealmRoles("admin", "superuser");
            ApiKeyEntity key = apiKey(Set.of(), Set.of("user"));

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertNull(token.getRealmAccess());
        }

        @Test
        void keepsOnlyGrantedClientRoles() {
            AccessToken token = tokenWithClientRoles("my-client", "read", "write", "delete");
            ApiKeyEntity key = apiKey(Set.of(), Set.of("read"));

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertNotNull(token.getResourceAccess());
            AccessToken.Access clientAccess = token.getResourceAccess().get("my-client");
            assertNotNull(clientAccess);
            assertEquals(Set.of("read"), clientAccess.getRoles());
        }

        @Test
        void removesClientEntryWhenNoGrantedClientRolesMatch() {
            AccessToken token = tokenWithClientRoles("my-client", "admin-only");
            ApiKeyEntity key = apiKey(Set.of(), Set.of("read"));

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertTrue(token.getResourceAccess().isEmpty());
        }

        @Test
        void doesNotAddRolesNotProducedByMappers() {
            // Mapper only produced "user" — API key grants "user" + "admin"
            // Result must still only contain "user"
            AccessToken token = tokenWithRealmRoles("user");
            ApiKeyEntity key = apiKey(Set.of(), Set.of("user", "admin"));

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertNotNull(token.getRealmAccess());
            assertEquals(Set.of("user"), token.getRealmAccess().getRoles());
        }

        @Test
        void handlesNullRealmAndResourceAccessGracefully() {
            AccessToken token = new AccessToken(); // realmAccess = null, resourceAccess field = null
            ApiKeyEntity key = apiKey(Set.of(), Set.of("admin"));

            // Must not throw
            ApiKeyTokenHelper.restrictRoles(token, key);

            assertNull(token.getRealmAccess());
            // getResourceAccess() returns emptyMap when internal field is null
            assertTrue(token.getResourceAccess().isEmpty());
        }

        @Test
        void filtersAcrossBothRealmAndClientRolesInOnePass() {
            AccessToken token = new AccessToken();

            AccessToken.Access realmAccess = new AccessToken.Access();
            realmAccess.addRole("admin");
            realmAccess.addRole("user");
            token.setRealmAccess(realmAccess);

            AccessToken.Access clientAccess = new AccessToken.Access();
            clientAccess.addRole("read");
            clientAccess.addRole("write");
            token.setResourceAccess(Map.of("svc", clientAccess));

            // Grant only "user" realm role and "read" client role
            ApiKeyEntity key = apiKey(Set.of(), Set.of("user", "read"));

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertEquals(Set.of("user"), token.getRealmAccess().getRoles());
            assertEquals(Set.of("read"), token.getResourceAccess().get("svc").getRoles());
        }

        @Test
        void ignoresBlankRoleNamesInApiKeyGrant() {
            AccessToken token = tokenWithRealmRoles("user");
            ApiKeyEntity key = apiKey(Set.of(), Set.of("user", "", "  "));

            ApiKeyTokenHelper.restrictRoles(token, key);

            assertNotNull(token.getRealmAccess());
            assertEquals(Set.of("user"), token.getRealmAccess().getRoles());
        }
    }
}
