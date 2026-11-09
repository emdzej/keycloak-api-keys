/*
 * Copyright (c) 2026 Michał Jaskólski and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package pl.emdzej.keycloak.apikeys.ratelimit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Behaviour both rate limiter implementations must share. Fixed-window implementations
 * reset on aligned boundaries, so timing-sensitive tests start at a fresh second.
 */
abstract class RateLimiterContractTest {

    protected RateLimiter limiter;

    protected abstract RateLimiter createLimiter();

    @BeforeEach
    void createLimiterUnderTest() {
        limiter = createLimiter();
    }

    @Test
    void burstLimitsRequestsWithinOneSecond() throws InterruptedException {
        limiter.updateConfig("k", new RateLimitConfig(100, 1000, 10000, 3));
        awaitStartOfNextSecond();

        assertTrue(limiter.tryAcquire("k"));
        assertTrue(limiter.tryAcquire("k"));
        assertTrue(limiter.tryAcquire("k"));
        assertFalse(limiter.tryAcquire("k"), "4th request in the same second exceeds burst");

        Thread.sleep(1_100);
        assertTrue(limiter.tryAcquire("k"), "burst capacity recovers after a second");
    }

    @Test
    void burstDoesNotCapThePerMinuteLimit() throws InterruptedException {
        // Regression: burst used to be a 60s window, capping perMinute at min(perMinute, burst).
        limiter.updateConfig("k", new RateLimitConfig(20, 1000, 10000, 5));
        awaitStartOfNextSecond();

        int allowed = 0;
        for (int second = 0; second < 4; second++) {
            for (int i = 0; i < 5; i++) {
                if (limiter.tryAcquire("k")) {
                    allowed++;
                }
            }
            Thread.sleep(1_050);
        }
        assertEquals(20, allowed, "5/s for 4s must use the full per-minute limit of 20");
    }

    @Test
    void zeroDisablesAWindow() {
        limiter.updateConfig("k", new RateLimitConfig(2, 0, 0, 0));

        assertTrue(limiter.tryAcquire("k"));
        assertTrue(limiter.tryAcquire("k"));
        assertFalse(limiter.tryAcquire("k"), "per-minute limit still applies");
    }

    @Test
    void allZeroMeansUnlimited() {
        limiter.updateConfig("k", new RateLimitConfig(0, 0, 0, 0));

        for (int i = 0; i < 500; i++) {
            assertTrue(limiter.tryAcquire("k"), "request " + i);
        }
        assertEquals(Integer.MAX_VALUE, limiter.getInfo("k").remaining());
    }

    @Test
    void negativeValuesAreTreatedAsUnlimited() {
        limiter.updateConfig("k", new RateLimitConfig(-1, -1, -1, -1));

        for (int i = 0; i < 100; i++) {
            assertTrue(limiter.tryAcquire("k"));
        }
    }

    @Test
    void infoReportsRemainingForTheTightestWindow() {
        limiter.updateConfig("k", new RateLimitConfig(5, 100, 1000, 0));
        limiter.tryAcquire("k");

        RateLimitInfo info = limiter.getInfo("k");
        assertEquals(5, info.limit());
        assertEquals(4, info.remaining());
    }

    @Test
    void retryAfterPointsAtTheExhaustedWindowNotTheDay() {
        limiter.updateConfig("k", new RateLimitConfig(1, 1000, 10000, 0));
        limiter.tryAcquire("k");
        assertFalse(limiter.tryAcquire("k"));

        long secondsUntilReset = limiter.getInfo("k").resetAt() - java.time.Instant.now().getEpochSecond();
        assertTrue(secondsUntilReset >= 0 && secondsUntilReset <= 61,
            "reset should be within the minute window, was " + secondsUntilReset + "s");
    }

    @Test
    void countersAreIsolatedPerKey() {
        limiter.updateConfig("a", new RateLimitConfig(1, 0, 0, 0));
        limiter.updateConfig("b", new RateLimitConfig(1, 0, 0, 0));

        assertTrue(limiter.tryAcquire("a"));
        assertFalse(limiter.tryAcquire("a"));
        assertTrue(limiter.tryAcquire("b"));
    }

    private static void awaitStartOfNextSecond() throws InterruptedException {
        long now = System.currentTimeMillis();
        Thread.sleep(1_000 - (now % 1_000) + 10);
    }
}
