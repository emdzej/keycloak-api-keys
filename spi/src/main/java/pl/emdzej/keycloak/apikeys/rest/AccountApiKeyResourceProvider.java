package pl.emdzej.keycloak.apikeys.rest;

import org.keycloak.models.KeycloakSession;
import org.keycloak.services.resource.AccountResourceProvider;

public class AccountApiKeyResourceProvider implements AccountResourceProvider {
    private final KeycloakSession session;

    public AccountApiKeyResourceProvider(KeycloakSession session) {
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
