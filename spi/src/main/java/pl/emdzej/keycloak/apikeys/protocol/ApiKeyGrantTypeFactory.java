package pl.emdzej.keycloak.apikeys.protocol;

import org.keycloak.Config;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.protocol.oidc.grants.OAuth2GrantType;
import org.keycloak.protocol.oidc.grants.OAuth2GrantTypeFactory;

public class ApiKeyGrantTypeFactory implements OAuth2GrantTypeFactory {

    @Override
    public String getId() {
        return ApiKeyGrantType.GRANT_TYPE;
    }

    @Override
    public OAuth2GrantType create(KeycloakSession session) {
        return new ApiKeyGrantType();
    }

    @Override
    public void init(Config.Scope config) {
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
    }

    @Override
    public void close() {
    }
}
