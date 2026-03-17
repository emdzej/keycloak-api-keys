package pl.emdzej.keycloak.apikeys.ratelimit;

import org.keycloak.provider.Provider;
import org.keycloak.provider.ProviderFactory;
import org.keycloak.provider.Spi;

public class RateLimiterSpi implements Spi {
    @Override
    public boolean isInternal() {
        return false;
    }

    @Override
    public String getName() {
        return "rateLimiter";
    }

    @Override
    public Class<? extends Provider> getProviderClass() {
        return RateLimiterProvider.class;
    }

    @Override
    public Class<? extends ProviderFactory> getProviderFactoryClass() {
        return RateLimiterProviderFactory.class;
    }
}
