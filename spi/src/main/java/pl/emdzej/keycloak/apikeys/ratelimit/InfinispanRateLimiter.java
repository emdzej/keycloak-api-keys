package pl.emdzej.keycloak.apikeys.ratelimit;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import org.infinispan.Cache;
import org.jboss.logging.Logger;
import org.keycloak.connections.infinispan.InfinispanConnectionProvider;
import org.keycloak.models.KeycloakSession;

public class InfinispanRateLimiter implements RateLimiter {
    private static final Logger LOGGER = Logger.getLogger(InfinispanRateLimiter.class);
    private static final String CACHE_NAME = "api-keys-rate-limit";

    private final Cache<String, RateLimitEntry> cache;
    private final Map<String, RateLimitConfig> configs = new ConcurrentHashMap<>();

    public InfinispanRateLimiter(KeycloakSession session) {
        this.cache = session.getProvider(InfinispanConnectionProvider.class).getCache(CACHE_NAME);
    }

    @Override
    public void updateConfig(String keyId, RateLimitConfig config) {
        configs.put(keyId, normalize(config));
    }

    @Override
    public boolean tryAcquire(String keyId) {
        RateLimitConfig config = getConfig(keyId);
        boolean allowed = true;
        allowed &= incrementAndCheck(keyId, "minute", config.perMinute(), TimeUnit.MINUTES.toMillis(1));
        allowed &= incrementAndCheck(keyId, "hour", config.perHour(), TimeUnit.HOURS.toMillis(1));
        allowed &= incrementAndCheck(keyId, "day", config.perDay(), TimeUnit.DAYS.toMillis(1));
        allowed &= incrementAndCheck(keyId, "burst", config.burst(), TimeUnit.MINUTES.toMillis(1));
        return allowed;
    }

    @Override
    public RateLimitInfo getInfo(String keyId) {
        RateLimitConfig config = getConfig(keyId);
        long nowMs = System.currentTimeMillis();

        WindowInfo minute = getWindowInfo(keyId, "minute", config.perMinute(), TimeUnit.MINUTES.toMillis(1), nowMs);
        WindowInfo hour = getWindowInfo(keyId, "hour", config.perHour(), TimeUnit.HOURS.toMillis(1), nowMs);
        WindowInfo day = getWindowInfo(keyId, "day", config.perDay(), TimeUnit.DAYS.toMillis(1), nowMs);
        WindowInfo burst = getWindowInfo(keyId, "burst", config.burst(), TimeUnit.MINUTES.toMillis(1), nowMs);

        int remaining = Math.min(
            Math.min(minute.remaining, hour.remaining),
            Math.min(day.remaining, burst.remaining)
        );
        long resetAt = Math.max(
            Math.max(minute.resetAtEpochSeconds, hour.resetAtEpochSeconds),
            Math.max(day.resetAtEpochSeconds, burst.resetAtEpochSeconds)
        );
        return new RateLimitInfo(config.perMinute(), Math.max(remaining, 0), resetAt);
    }

    @Override
    public void reset(String keyId) {
        configs.remove(keyId);
        cache.remove(buildKey(keyId, "minute"));
        cache.remove(buildKey(keyId, "hour"));
        cache.remove(buildKey(keyId, "day"));
        cache.remove(buildKey(keyId, "burst"));
    }

    private boolean incrementAndCheck(String keyId, String windowName, int limit, long windowDurationMs) {
        if (limit <= 0) {
            return true;
        }
        long nowMs = System.currentTimeMillis();
        String cacheKey = buildKey(keyId, windowName);
        RateLimitEntry entry = cache.compute(cacheKey, (key, existing) -> {
            if (existing == null || isExpired(existing, nowMs)) {
                return new RateLimitEntry(1, nowMs, windowDurationMs);
            }
            return new RateLimitEntry(existing.count() + 1, existing.windowStart(), existing.windowDurationMs());
        });
        updateTtl(cacheKey, entry, nowMs);
        return entry.count() <= limit;
    }

    private WindowInfo getWindowInfo(String keyId, String windowName, int limit, long windowDurationMs, long nowMs) {
        if (limit <= 0) {
            return new WindowInfo(limit, 0, nowMs / 1000);
        }
        String cacheKey = buildKey(keyId, windowName);
        RateLimitEntry entry = cache.get(cacheKey);
        if (entry == null || isExpired(entry, nowMs)) {
            return new WindowInfo(limit, limit, nowMs / 1000);
        }
        long resetAt = (entry.windowStart() + windowDurationMs) / 1000;
        int remaining = (int) Math.max(limit - entry.count(), 0);
        return new WindowInfo(limit, remaining, resetAt);
    }

    private void updateTtl(String cacheKey, RateLimitEntry entry, long nowMs) {
        long windowEndMs = entry.windowStart() + entry.windowDurationMs();
        long lifespanMs = Math.max(windowEndMs - nowMs, 1);
        try {
            cache.put(cacheKey, entry, lifespanMs, TimeUnit.MILLISECONDS);
        } catch (Exception ex) {
            LOGGER.debugf(ex, "Failed to update TTL for rate limit cache key %s", cacheKey);
        }
    }

    private boolean isExpired(RateLimitEntry entry, long nowMs) {
        return entry.windowStart() + entry.windowDurationMs() <= nowMs;
    }

    private String buildKey(String keyId, String windowName) {
        return keyId + ":" + windowName;
    }

    private RateLimitConfig getConfig(String keyId) {
        return configs.getOrDefault(keyId, RateLimitConfig.defaults());
    }

    private RateLimitConfig normalize(RateLimitConfig config) {
        RateLimitConfig defaults = RateLimitConfig.defaults();
        if (config == null) {
            return defaults;
        }
        return new RateLimitConfig(
            config.perMinute() > 0 ? config.perMinute() : defaults.perMinute(),
            config.perHour() > 0 ? config.perHour() : defaults.perHour(),
            config.perDay() > 0 ? config.perDay() : defaults.perDay(),
            config.burst() > 0 ? config.burst() : defaults.burst()
        );
    }

    private static class WindowInfo {
        private final int limit;
        private final int remaining;
        private final long resetAtEpochSeconds;

        private WindowInfo(int limit, int remaining, long resetAtEpochSeconds) {
            this.limit = limit;
            this.remaining = remaining;
            this.resetAtEpochSeconds = resetAtEpochSeconds;
        }
    }
}
