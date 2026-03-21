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

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.keycloak.connections.infinispan.InfinispanConnectionProvider;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;

/**
 * Verifies H4: DefaultRateLimiterProvider selects the correct RateLimiter
 * based on Infinispan availability and the fail-closed realm attribute.
 */
class DefaultRateLimiterProviderTest {

    private KeycloakSession session;
    private RealmModel realm;

    @BeforeEach
    void setUp() {
        session = mock(KeycloakSession.class);
        realm   = mock(RealmModel.class);

        KeycloakContext ctx = mock(KeycloakContext.class);
        when(session.getContext()).thenReturn(ctx);
        when(ctx.getRealm()).thenReturn(realm);
        when(realm.getAttribute(DefaultRateLimiterProvider.FAIL_CLOSED_ATTR)).thenReturn(null);
    }

    // ── Infinispan unavailable + fail-closed disabled → InMemoryRateLimiter ──

    @Nested
    class InfinispanUnavailableFailOpenMode {

        @Test
        void returnsInMemoryRateLimiterWhenInfinispanProviderIsNull() {
            when(session.getProvider(InfinispanConnectionProvider.class)).thenReturn(null);

            DefaultRateLimiterProvider provider = new DefaultRateLimiterProvider(session);
            RateLimiter limiter = provider.getRateLimiter();

            assertInstanceOf(InMemoryRateLimiter.class, limiter,
                "Should fall back to InMemoryRateLimiter when Infinispan unavailable and fail-closed=false");
        }

        @Test
        void returnsInMemoryRateLimiterWhenInfinispanThrows() {
            when(session.getProvider(InfinispanConnectionProvider.class))
                .thenThrow(new RuntimeException("Infinispan connection failed"));

            DefaultRateLimiterProvider provider = new DefaultRateLimiterProvider(session);
            RateLimiter limiter = provider.getRateLimiter();

            assertInstanceOf(InMemoryRateLimiter.class, limiter,
                "Should fall back to InMemoryRateLimiter when Infinispan throws and fail-closed=false");
        }
    }

    // ── Infinispan unavailable + fail-closed enabled → FailClosedRateLimiter ─

    @Nested
    class InfinispanUnavailableFailClosedMode {

        @BeforeEach
        void enableFailClosed() {
            when(realm.getAttribute(DefaultRateLimiterProvider.FAIL_CLOSED_ATTR))
                .thenReturn("true");
        }

        @Test
        void returnsFailClosedRateLimiterWhenInfinispanProviderIsNull() {
            when(session.getProvider(InfinispanConnectionProvider.class)).thenReturn(null);

            DefaultRateLimiterProvider provider = new DefaultRateLimiterProvider(session);
            RateLimiter limiter = provider.getRateLimiter();

            assertInstanceOf(FailClosedRateLimiter.class, limiter,
                "Should return FailClosedRateLimiter when Infinispan unavailable and fail-closed=true");
        }

        @Test
        void returnsFailClosedRateLimiterWhenInfinispanThrows() {
            when(session.getProvider(InfinispanConnectionProvider.class))
                .thenThrow(new RuntimeException("cache down"));

            DefaultRateLimiterProvider provider = new DefaultRateLimiterProvider(session);
            RateLimiter limiter = provider.getRateLimiter();

            assertInstanceOf(FailClosedRateLimiter.class, limiter);
        }

        @Test
        void failClosedLimiterIsUnhealthy() {
            when(session.getProvider(InfinispanConnectionProvider.class)).thenReturn(null);

            DefaultRateLimiterProvider provider = new DefaultRateLimiterProvider(session);
            RateLimiter limiter = provider.getRateLimiter();

            org.junit.jupiter.api.Assertions.assertFalse(limiter.isHealthy(),
                "FailClosedRateLimiter must be unhealthy so grant type returns 503");
        }
    }

    // ── Fail-closed attribute case-insensitivity ───────────────────────────────

    @Nested
    class FailClosedAttributeParsing {

        @Test
        void trueValueIsCaseInsensitive() {
            when(realm.getAttribute(DefaultRateLimiterProvider.FAIL_CLOSED_ATTR))
                .thenReturn("TRUE");
            when(session.getProvider(InfinispanConnectionProvider.class)).thenReturn(null);

            RateLimiter limiter = new DefaultRateLimiterProvider(session).getRateLimiter();
            assertInstanceOf(FailClosedRateLimiter.class, limiter);
        }

        @Test
        void falseValueResultsInFallback() {
            when(realm.getAttribute(DefaultRateLimiterProvider.FAIL_CLOSED_ATTR))
                .thenReturn("false");
            when(session.getProvider(InfinispanConnectionProvider.class)).thenReturn(null);

            RateLimiter limiter = new DefaultRateLimiterProvider(session).getRateLimiter();
            assertInstanceOf(InMemoryRateLimiter.class, limiter);
        }

        @Test
        void nullAttributeResultsInFallback() {
            when(realm.getAttribute(DefaultRateLimiterProvider.FAIL_CLOSED_ATTR))
                .thenReturn(null);
            when(session.getProvider(InfinispanConnectionProvider.class)).thenReturn(null);

            RateLimiter limiter = new DefaultRateLimiterProvider(session).getRateLimiter();
            assertInstanceOf(InMemoryRateLimiter.class, limiter);
        }
    }

    // ── Result is cached (double-checked locking) ─────────────────────────────

    @Test
    void returnsSameInstanceOnSubsequentCalls() {
        when(session.getProvider(InfinispanConnectionProvider.class)).thenReturn(null);

        DefaultRateLimiterProvider provider = new DefaultRateLimiterProvider(session);
        RateLimiter first  = provider.getRateLimiter();
        RateLimiter second = provider.getRateLimiter();

        org.junit.jupiter.api.Assertions.assertSame(first, second,
            "getRateLimiter must return the same cached instance");
    }
}
