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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.ws.rs.NotFoundException;
import org.junit.jupiter.api.Test;
import org.keycloak.Config;
import org.keycloak.connections.jpa.JpaConnectionProvider;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.services.resources.admin.fgap.AdminPermissionEvaluator;

/** Guards the bundled manifest against drifting from the Admin API it describes. */
class KcctlManifestTest {

    private static final String MANIFEST = AdminApiKeyResource.KCCTL_MANIFEST;

    @Test
    void isBundledAndDeclaresTheProvider() {
        assertTrue(MANIFEST.contains("apiVersion: kcctl/v1"));
        assertTrue(MANIFEST.contains("admin-realm-restapi-extension/api-keys"));
    }

    @Test
    void statusValuesMatchTheAdminListFilter() {
        assertTrue(MANIFEST.contains("values: [active, revoked, expired]"),
            "kcctl --status must offer every value AdminApiKeyResource.parseStatus accepts");
    }

    @Test
    void verbPathsMatchAdminEndpoints() {
        assertTrue(MANIFEST.contains("path: users/{user}/api-keys"));
        assertTrue(MANIFEST.contains("path: \"{key}/stats\""));
        assertTrue(MANIFEST.contains("path: \"{key}\""));
        assertTrue(MANIFEST.contains("path: health"));
    }

    @Test
    void endpointIsOffByDefault() {
        Config.Scope config = mock(Config.Scope.class);
        when(config.getBoolean(AdminApiKeyResourceProviderFactory.KCCTL_EXTENSION_ENABLED, false)).thenReturn(false);

        var factory = new AdminApiKeyResourceProviderFactory();
        factory.init(config);

        var property = factory.getConfigMetadata().get(0);
        assertEquals(AdminApiKeyResourceProviderFactory.KCCTL_EXTENSION_ENABLED, property.getName());
        assertEquals(false, property.getDefaultValue());

        KeycloakSession session = session();
        var resource = (AdminApiKeyResource) factory.create(session).getResource(
            session, mock(RealmModel.class), mock(AdminPermissionEvaluator.class, RETURNS_DEEP_STUBS), null);
        assertThrows(NotFoundException.class, resource::kcctlExtension);
    }

    @Test
    void endpointServesManifestWhenEnabled() {
        var response = resource(true).kcctlExtension();
        assertEquals(200, response.getStatus());
        assertEquals(MANIFEST, response.getEntity());
    }

    private static AdminApiKeyResource resource(boolean kcctlExtensionEnabled) {
        KeycloakSession session = session();
        AdminPermissionEvaluator auth = mock(AdminPermissionEvaluator.class, RETURNS_DEEP_STUBS);
        return new AdminApiKeyResource(session, mock(RealmModel.class), auth, kcctlExtensionEnabled);
    }

    private static KeycloakSession session() {
        KeycloakSession session = mock(KeycloakSession.class);
        when(session.getProvider(JpaConnectionProvider.class))
            .thenReturn(mock(JpaConnectionProvider.class, RETURNS_DEEP_STUBS));
        return session;
    }
}
