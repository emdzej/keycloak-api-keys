package pl.emdzej.keycloak.apikeys.rest;

import org.keycloak.models.KeycloakSession;
import org.keycloak.services.resource.RealmResourceProvider;

public class AdminApiKeyResourceProvider implements RealmResourceProvider {
    private final KeycloakSession session;

    public AdminApiKeyResourceProvider(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public Object getResource() {
        return new AdminApiKeyResource(session);
    }

    @Override
    public void close() {
        // no-op
    }
}
