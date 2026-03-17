package pl.emdzej.keycloak.apikeys.ratelimit;

public interface RateLimiter {
    boolean tryAcquire(String keyId);

    RateLimitInfo getInfo(String keyId);

    void reset(String keyId);
}
