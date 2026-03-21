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
