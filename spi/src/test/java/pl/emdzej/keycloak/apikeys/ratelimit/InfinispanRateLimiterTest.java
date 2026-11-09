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
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.concurrent.TimeUnit;
import org.infinispan.Cache;
import org.infinispan.configuration.cache.ConfigurationBuilder;
import org.infinispan.configuration.global.GlobalConfigurationBuilder;
import org.infinispan.manager.DefaultCacheManager;
import org.infinispan.manager.EmbeddedCacheManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.keycloak.connections.infinispan.InfinispanConnectionProvider;

class InfinispanRateLimiterTest extends RateLimiterContractTest {

    private EmbeddedCacheManager cacheManager;

    @Override
    protected RateLimiter createLimiter() {
        cacheManager = localCacheManagerWithWorkCache();
        return new InfinispanRateLimiter(InfinispanRateLimiter.getOrCreateCache(providerFor(cacheManager)));
    }

    @AfterEach
    void stopCacheManager() {
        if (cacheManager != null) {
            cacheManager.stop();
        }
    }

    @Nested
    class CacheBootstrap {

        @Test
        void createsCacheWhenKeycloakConfigDoesNotDefineIt() {
            // Regression: getCache() on an undefined cache threw, silently forcing the fallback.
            EmbeddedCacheManager manager = localCacheManagerWithWorkCache();
            try {
                Cache<String, Long> cache = InfinispanRateLimiter.getOrCreateCache(providerFor(manager));
                assertEquals(InfinispanRateLimiter.CACHE_NAME, cache.getName());
                assertTrue(new InfinispanRateLimiter(cache).isHealthy());
            } finally {
                manager.stop();
            }
        }

        @Test
        void usesOperatorDefinedCacheWhenPresent() {
            EmbeddedCacheManager manager = localCacheManagerWithWorkCache();
            try {
                ConfigurationBuilder custom = new ConfigurationBuilder();
                custom.expiration().lifespan(5, TimeUnit.MINUTES);
                manager.defineConfiguration(InfinispanRateLimiter.CACHE_NAME, custom.build());
                Cache<String, Long> expected = manager.getCache(InfinispanRateLimiter.CACHE_NAME);

                assertSame(expected, InfinispanRateLimiter.getOrCreateCache(providerFor(manager)));
                assertEquals(TimeUnit.MINUTES.toMillis(5),
                    expected.getCacheConfiguration().expiration().lifespan());
            } finally {
                manager.stop();
            }
        }

        @Test
        void storesOnlyLongCounters() {
            // Values must be marshallable by Keycloak's ProtoStream marshaller in clustered mode.
            limiter.updateConfig("k", new RateLimitConfig(5, 0, 0, 0));
            limiter.tryAcquire("k");
            Cache<Object, Object> cache = cacheManager.getCache(InfinispanRateLimiter.CACHE_NAME);
            assertTrue(cache.values().stream().allMatch(Long.class::isInstance));
        }
    }

    private static EmbeddedCacheManager localCacheManagerWithWorkCache() {
        DefaultCacheManager manager = new DefaultCacheManager(new GlobalConfigurationBuilder().nonClusteredDefault().build());
        manager.defineConfiguration(InfinispanConnectionProvider.WORK_CACHE_NAME, new ConfigurationBuilder().build());
        return manager;
    }

    private static InfinispanConnectionProvider providerFor(EmbeddedCacheManager manager) {
        InfinispanConnectionProvider provider = mock(InfinispanConnectionProvider.class);
        Cache<Object, Object> work = manager.getCache(InfinispanConnectionProvider.WORK_CACHE_NAME);
        when(provider.getCache(InfinispanConnectionProvider.WORK_CACHE_NAME)).thenReturn(work);
        return provider;
    }
}
