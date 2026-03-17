package pl.emdzej.keycloak.apikeys.ratelimit;

public interface RateLimiter {
    void updateConfig(String keyId, RateLimitConfig config);

    boolean tryAcquire(String keyId);

    RateLimitInfo getInfo(String keyId);

    void reset(String keyId);

    boolean isHealthy();
}
