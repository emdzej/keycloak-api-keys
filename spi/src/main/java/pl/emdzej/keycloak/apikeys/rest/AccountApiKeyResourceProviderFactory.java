package pl.emdzej.keycloak.apikeys.rest;

import org.keycloak.Config;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.services.resource.AccountResourceProvider;
import org.keycloak.services.resource.AccountResourceProviderFactory;

public class AccountApiKeyResourceProviderFactory implements AccountResourceProviderFactory {
    public static final String ID = "api-keys";

    @Override
    public AccountResourceProvider create(KeycloakSession session) {
        return new AccountApiKeyResourceProvider(session);
    }

    @Override
    public void init(Config.Scope config) {
        // no-op
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
