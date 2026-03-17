package pl.emdzej.keycloak.apikeys.ratelimit;

import org.keycloak.Config;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderFactory;

public class RateLimiterProviderFactory implements ProviderFactory<RateLimiterProvider> {
    public static final String ID = "default";

    @Override
    public RateLimiterProvider create(KeycloakSession session) {
        return new DefaultRateLimiterProvider(session);
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
