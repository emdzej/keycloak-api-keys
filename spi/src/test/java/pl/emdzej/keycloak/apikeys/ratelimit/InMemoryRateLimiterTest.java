package pl.emdzej.keycloak.apikeys.ratelimit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class InMemoryRateLimiterTest {

    private InMemoryRateLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new InMemoryRateLimiter();
    }

    // ── isHealthy ─────────────────────────────────────────────────────────────

    @Test
    void isAlwaysHealthy() {
        assertTrue(limiter.isHealthy());
    }

    // ── tryAcquire ────────────────────────────────────────────────────────────

    @Nested
    class TryAcquire {

        @Test
        void allowsRequestsUpToPerMinuteLimit() {
            // Small limit so the test runs quickly
            RateLimitConfig config = new RateLimitConfig(3, 1000, 10000, 10);
            limiter.updateConfig("key-1", config);

            assertTrue(limiter.tryAcquire("key-1"), "1st request");
            assertTrue(limiter.tryAcquire("key-1"), "2nd request");
            assertTrue(limiter.tryAcquire("key-1"), "3rd request");
            assertFalse(limiter.tryAcquire("key-1"), "4th request should be rate-limited");
        }

        @Test
        void isolatesCountersByKeyId() {
            RateLimitConfig config = new RateLimitConfig(1, 1000, 10000, 10);
            limiter.updateConfig("key-a", config);
            limiter.updateConfig("key-b", config);

            assertTrue(limiter.tryAcquire("key-a"));
            assertFalse(limiter.tryAcquire("key-a"), "key-a exhausted");
            assertTrue(limiter.tryAcquire("key-b"), "key-b must be independent");
        }

        @Test
        void allowsAcquireForUnknownKeyUsingDefaults() {
            // No updateConfig called — should use defaults and not throw
            assertTrue(limiter.tryAcquire("unknown-key"));
        }

        @Test
        void resetsClearsCounterForKey() {
            RateLimitConfig config = new RateLimitConfig(1, 1000, 10000, 10);
            limiter.updateConfig("key-1", config);

            assertTrue(limiter.tryAcquire("key-1"));
            assertFalse(limiter.tryAcquire("key-1"), "exhausted");

            limiter.reset("key-1");

            // After reset, fresh defaults are applied — should be allowed again
            assertTrue(limiter.tryAcquire("key-1"), "allowed after reset");
        }
    }

    // ── updateConfig — H3 counter preservation ────────────────────────────────

    @Nested
    class UpdateConfig {

        @Test
        void preservesCountersWhenConfigIsUnchanged() {
            RateLimitConfig config = new RateLimitConfig(3, 1000, 10000, 10);
            limiter.updateConfig("key-1", config);

            // Consume 2 tokens
            assertTrue(limiter.tryAcquire("key-1"));
            assertTrue(limiter.tryAcquire("key-1"));

            // Update with the exact same config — must NOT reset buckets
            limiter.updateConfig("key-1", config);

            // 1 token remaining, 4th should be denied
            assertTrue(limiter.tryAcquire("key-1"), "3rd token should still be available");
            assertFalse(limiter.tryAcquire("key-1"), "bucket should now be empty");
        }

        @Test
        void resetsBucketsWhenConfigActuallyChanges() {
            RateLimitConfig original = new RateLimitConfig(1, 1000, 10000, 10);
            limiter.updateConfig("key-1", original);

            // Exhaust the single token
            assertTrue(limiter.tryAcquire("key-1"));
            assertFalse(limiter.tryAcquire("key-1"), "exhausted with limit=1");

            // Change to a higher limit — buckets should be recreated at full capacity
            RateLimitConfig updated = new RateLimitConfig(5, 1000, 10000, 10);
            limiter.updateConfig("key-1", updated);

            assertTrue(limiter.tryAcquire("key-1"), "fresh bucket after config change");
        }

        @Test
        void doesNotResetOnRepeatedIdenticalUpdateCalls() {
            // Simulates ApiKeyGrantType calling updateConfig on every exchange (H3 scenario)
            RateLimitConfig config = new RateLimitConfig(2, 1000, 10000, 10);
            limiter.updateConfig("key-1", config);

            assertTrue(limiter.tryAcquire("key-1"), "1st acquire");

            // ApiKeyGrantType calls updateConfig before every tryAcquire
            limiter.updateConfig("key-1", config);
            assertTrue(limiter.tryAcquire("key-1"), "2nd acquire — counter must not have been reset");

            limiter.updateConfig("key-1", config);
            assertFalse(limiter.tryAcquire("key-1"), "3rd acquire — bucket exhausted");
        }

        @Test
        void createsEntryOnFirstUpdateConfig() {
            RateLimitConfig config = new RateLimitConfig(2, 1000, 10000, 10);
            limiter.updateConfig("brand-new-key", config);

            RateLimitInfo info = limiter.getInfo("brand-new-key");
            assertEquals(2, info.limit());
            assertTrue(info.remaining() >= 0);
        }
    }

    // ── getInfo ───────────────────────────────────────────────────────────────

    @Nested
    class GetInfo {

        @Test
        void returnsCorrectLimitAndRemainingTokens() {
            RateLimitConfig config = new RateLimitConfig(5, 1000, 10000, 10);
            limiter.updateConfig("key-1", config);

            limiter.tryAcquire("key-1");
            limiter.tryAcquire("key-1");

            RateLimitInfo info = limiter.getInfo("key-1");
            assertEquals(5, info.limit());
            assertEquals(3, info.remaining());
        }

        @Test
        void remainingIsNeverNegative() {
            RateLimitConfig config = new RateLimitConfig(1, 1000, 10000, 10);
            limiter.updateConfig("key-1", config);

            limiter.tryAcquire("key-1"); // consume the only token
            limiter.tryAcquire("key-1"); // attempt beyond limit

            RateLimitInfo info = limiter.getInfo("key-1");
            assertTrue(info.remaining() >= 0, "remaining must not be negative");
        }

        @Test
        void resetAtIsInTheFutureWhenExhausted() {
            RateLimitConfig config = new RateLimitConfig(1, 1000, 10000, 10);
            limiter.updateConfig("key-1", config);
            limiter.tryAcquire("key-1"); // exhaust

            RateLimitInfo info = limiter.getInfo("key-1");
            long nowSeconds = System.currentTimeMillis() / 1000;
            assertTrue(info.resetAt() >= nowSeconds,
                "resetAt must be now or in the future when bucket is exhausted");
        }
    }
}
