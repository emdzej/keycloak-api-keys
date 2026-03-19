package pl.emdzej.keycloak.apikeys.ratelimit;

import java.time.Instant;

/**
 * A no-op RateLimiter that always reports unhealthy and denies every acquire.
 *
 * Used when the distributed cache (Infinispan) is unavailable and the realm is
 * configured with {@code apiKeysRateLimitFailClosed=true}. In that mode we
 * prefer rejecting all exchanges with 503 over silently degrading to a per-node
 * limiter that no longer enforces the cluster-wide rate limit (H4).
 */
public class FailClosedRateLimiter implements RateLimiter {

    @Override
    public void updateConfig(String keyId, RateLimitConfig config) {
        // no state to update
    }

    @Override
    public boolean tryAcquire(String keyId) {
        return false; // always deny — caller maps this to 503 when isHealthy() == false
    }

    @Override
    public RateLimitInfo getInfo(String keyId) {
        return new RateLimitInfo(0, 0, Instant.now().getEpochSecond());
    }

    @Override
    public void reset(String keyId) {
        // no state to reset
    }

    /**
     * Returns {@code false} — the grant type checks this before rate-limit enforcement
     * and returns 503 Service Unavailable when the limiter is unhealthy (H4).
     */
    @Override
    public boolean isHealthy() {
        return false;
    }
}
