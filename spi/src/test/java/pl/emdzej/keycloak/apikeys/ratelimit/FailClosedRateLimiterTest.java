package pl.emdzej.keycloak.apikeys.ratelimit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Verifies H4: FailClosedRateLimiter always denies and reports unhealthy,
 * so the grant type can return 503 when Infinispan is unavailable in fail-closed mode.
 */
class FailClosedRateLimiterTest {

    private FailClosedRateLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new FailClosedRateLimiter();
    }

    @Test
    void isNotHealthy() {
        assertFalse(limiter.isHealthy(),
            "FailClosedRateLimiter must always report unhealthy to trigger 503");
    }

    @Test
    void tryAcquireAlwaysReturnsFalse() {
        assertFalse(limiter.tryAcquire("any-key-id"),
            "FailClosedRateLimiter must always deny acquisition");
    }

    @Test
    void tryAcquireReturnsFalseForAnyKey() {
        assertFalse(limiter.tryAcquire("key-1"));
        assertFalse(limiter.tryAcquire("key-2"));
        assertFalse(limiter.tryAcquire("completely-different-key"));
    }

    @Test
    void getInfoReturnsZeroLimitAndRemaining() {
        RateLimitInfo info = limiter.getInfo("any-key");
        assertNotNull(info);
        org.junit.jupiter.api.Assertions.assertEquals(0, info.limit());
        org.junit.jupiter.api.Assertions.assertEquals(0, info.remaining());
    }

    @Test
    void updateConfigDoesNotThrow() {
        // Must be a no-op, not throw
        limiter.updateConfig("key-1", new RateLimitConfig(10, 100, 1000, 5));
        limiter.updateConfig("key-1", new RateLimitConfig(10, 100, 1000, 5));
    }

    @Test
    void resetDoesNotThrow() {
        limiter.reset("key-1");
    }

    @Test
    void remainsUnhealthyAfterUpdateConfigAndTryAcquire() {
        limiter.updateConfig("key-1", new RateLimitConfig(1000, 10000, 100000, 50));
        limiter.tryAcquire("key-1");
        assertFalse(limiter.isHealthy(),
            "FailClosedRateLimiter must remain unhealthy regardless of usage");
    }
}
