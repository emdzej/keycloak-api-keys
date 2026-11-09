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

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import org.infinispan.Cache;
import org.infinispan.commons.api.CacheContainerAdmin;
import org.infinispan.configuration.cache.CacheMode;
import org.infinispan.configuration.cache.ConfigurationBuilder;
import org.infinispan.manager.EmbeddedCacheManager;
import org.jboss.logging.Logger;
import org.keycloak.connections.infinispan.InfinispanConnectionProvider;
import org.keycloak.models.KeycloakSession;

/**
 * Cluster-wide fixed-window rate limiter backed by the {@value #CACHE_NAME} Infinispan cache.
 *
 * <p>Values are plain {@code Long} counters keyed by {@code keyId:window:windowStart} and
 * updated with {@code putIfAbsent}/{@code replace} CAS loops. Keycloak's ProtoStream marshaller
 * handles {@code Long} natively, so the cache also works in clustered (DIST) mode without
 * registering custom schemas or serializing lambdas.
 *
 * <p>If the cache is not defined in the Keycloak cache configuration it is created at runtime
 * (distributed when the cache manager is clustered, local otherwise). An operator-defined
 * cache with the same name always takes precedence.
 */
public class InfinispanRateLimiter implements RateLimiter {
    private static final Logger LOGGER = Logger.getLogger(InfinispanRateLimiter.class);
    static final String CACHE_NAME = "api-keys-rate-limit";
    private static final int MAX_CAS_ATTEMPTS = 32;

    private final Cache<String, Long> cache;
    private final Map<String, RateLimitConfig> configs = new ConcurrentHashMap<>();

    public InfinispanRateLimiter(KeycloakSession session) {
        this(getOrCreateCache(session.getProvider(InfinispanConnectionProvider.class)));
    }

    InfinispanRateLimiter(Cache<String, Long> cache) {
        this.cache = cache;
    }

    static Cache<String, Long> getOrCreateCache(InfinispanConnectionProvider provider) {
        EmbeddedCacheManager cacheManager =
            provider.getCache(InfinispanConnectionProvider.WORK_CACHE_NAME).getCacheManager();
        if (cacheManager.getCacheConfiguration(CACHE_NAME) != null) {
            return cacheManager.getCache(CACHE_NAME);
        }
        ConfigurationBuilder builder = new ConfigurationBuilder();
        boolean clustered = cacheManager.getCacheManagerConfiguration().isClustered();
        builder.clustering().cacheMode(clustered ? CacheMode.DIST_SYNC : CacheMode.LOCAL);
        // Safety net only: every entry gets an explicit lifespan matching its window.
        builder.expiration().lifespan(Window.DAY.durationMs + 60_000L, TimeUnit.MILLISECONDS);
        LOGGER.infof("Creating Infinispan cache '%s' (%s)", CACHE_NAME, clustered ? "DIST_SYNC" : "LOCAL");
        return cacheManager.administration()
            .withFlags(CacheContainerAdmin.AdminFlag.VOLATILE)
            .getOrCreateCache(CACHE_NAME, builder.build());
    }

    @Override
    public void updateConfig(String keyId, RateLimitConfig config) {
        configs.put(keyId, RateLimitConfig.normalize(config));
    }

    @Override
    public boolean tryAcquire(String keyId) {
        RateLimitConfig config = getConfig(keyId);
        long nowMs = System.currentTimeMillis();
        List<Window> limited = Window.limitedFor(config);

        // Check every window before consuming, so a rejected request doesn't burn
        // hour/day quota. Concurrent callers can overshoot by at most their number.
        for (Window window : limited) {
            if (currentCount(keyId, window, nowMs) >= window.limit(config)) {
                return false;
            }
        }
        for (Window window : limited) {
            increment(keyId, window, nowMs);
        }
        return true;
    }

    @Override
    public RateLimitInfo getInfo(String keyId) {
        RateLimitConfig config = getConfig(keyId);
        long nowMs = System.currentTimeMillis();

        int remaining = Integer.MAX_VALUE;
        long blockedUntil = 0;
        for (Window window : Window.limitedFor(config)) {
            int windowRemaining = (int) Math.max(window.limit(config) - currentCount(keyId, window, nowMs), 0);
            remaining = Math.min(remaining, windowRemaining);
            if (windowRemaining == 0) {
                blockedUntil = Math.max(blockedUntil, window.endMs(nowMs));
            }
        }
        // Reset is when the caller can retry: the latest exhausted window, otherwise the minute window.
        long resetAtMs = blockedUntil > 0 ? blockedUntil : Window.MINUTE.endMs(nowMs);
        return new RateLimitInfo(config.perMinute(), remaining, Math.ceilDiv(resetAtMs, 1000L));
    }

    @Override
    public void reset(String keyId) {
        configs.remove(keyId);
        long nowMs = System.currentTimeMillis();
        for (Window window : Window.values()) {
            cache.remove(window.cacheKey(keyId, nowMs));
        }
    }

    @Override
    public boolean isHealthy() {
        return cache != null && cache.getStatus().allowInvocations();
    }

    private long currentCount(String keyId, Window window, long nowMs) {
        Long count = cache.get(window.cacheKey(keyId, nowMs));
        return count != null ? count : 0L;
    }

    private void increment(String keyId, Window window, long nowMs) {
        String cacheKey = window.cacheKey(keyId, nowMs);
        long lifespanMs = Math.max(window.endMs(nowMs) - nowMs, 1L);
        for (int attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
            Long existing = cache.putIfAbsent(cacheKey, 1L, lifespanMs, TimeUnit.MILLISECONDS);
            if (existing == null) {
                return;
            }
            if (cache.replace(cacheKey, existing, existing + 1, lifespanMs, TimeUnit.MILLISECONDS)) {
                return;
            }
        }
        LOGGER.debugf("Gave up incrementing rate limit counter %s after %d attempts", cacheKey, MAX_CAS_ATTEMPTS);
    }

    private RateLimitConfig getConfig(String keyId) {
        return configs.getOrDefault(keyId, RateLimitConfig.defaults());
    }

    /** Fixed, epoch-aligned windows. {@code burst} is enforced per second. */
    enum Window {
        SECOND("s", 1_000L),
        MINUTE("m", 60_000L),
        HOUR("h", 3_600_000L),
        DAY("d", 86_400_000L);

        private final String id;
        final long durationMs;

        Window(String id, long durationMs) {
            this.id = id;
            this.durationMs = durationMs;
        }

        int limit(RateLimitConfig config) {
            return switch (this) {
                case SECOND -> config.burst();
                case MINUTE -> config.perMinute();
                case HOUR -> config.perHour();
                case DAY -> config.perDay();
            };
        }

        long startMs(long nowMs) {
            return nowMs - (nowMs % durationMs);
        }

        long endMs(long nowMs) {
            return startMs(nowMs) + durationMs;
        }

        String cacheKey(String keyId, long nowMs) {
            return keyId + ":" + id + ":" + startMs(nowMs);
        }

        static List<Window> limitedFor(RateLimitConfig config) {
            return java.util.Arrays.stream(values())
                .filter(w -> !RateLimitConfig.isUnlimited(w.limit(config)))
                .toList();
        }
    }
}
