package pl.emdzej.keycloak.apikeys.ratelimit;

import org.keycloak.provider.Provider;

public interface RateLimiterProvider extends Provider {
    RateLimiter getRateLimiter();
}
