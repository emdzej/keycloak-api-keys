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

import java.util.List;
import org.keycloak.Config;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.provider.ProviderConfigurationBuilder;
import org.keycloak.services.resources.admin.ext.AdminRealmResourceProvider;
import org.keycloak.services.resources.admin.ext.AdminRealmResourceProviderFactory;

public class AdminApiKeyResourceProviderFactory implements AdminRealmResourceProviderFactory {
    public static final String ID = "api-keys";
    static final String KCCTL_EXTENSION_ENABLED = "kcctl-extension-enabled";

    private boolean kcctlExtensionEnabled;

    @Override
    public AdminRealmResourceProvider create(KeycloakSession session) {
        return new AdminApiKeyResourceProvider(session, kcctlExtensionEnabled);
    }

    @Override
    public void init(Config.Scope config) {
        kcctlExtensionEnabled = config.getBoolean(KCCTL_EXTENSION_ENABLED, false);
    }

    @Override
    public List<ProviderConfigProperty> getConfigMetadata() {
        return ProviderConfigurationBuilder.create()
            .property()
            .name(KCCTL_EXTENSION_ENABLED)
            .type("boolean")
            .helpText("Serve the kcctl extension manifest at /admin/realms/{realm}/api-keys/kcctl-extension.")
            .defaultValue(false)
            .add()
            .build();
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
        // no-op
    }

    @Override
    public void close() {
        // no-op
    }

    @Override
    public String getId() {
        return ID;
    }
}
