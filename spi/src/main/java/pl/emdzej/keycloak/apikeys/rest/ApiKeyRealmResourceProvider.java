package pl.emdzej.keycloak.apikeys.rest;

import org.keycloak.models.KeycloakSession;
import org.keycloak.services.resource.RealmResourceProvider;

public class ApiKeyRealmResourceProvider implements RealmResourceProvider {
    private final KeycloakSession session;

    public ApiKeyRealmResourceProvider(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public Object getResource() {
        return new AccountApiKeyResource(session);
    }

    @Override
    public void close() {
        // no-op
    }
}
