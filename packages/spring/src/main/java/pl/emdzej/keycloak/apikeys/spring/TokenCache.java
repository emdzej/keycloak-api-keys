package pl.emdzej.keycloak.apikeys.spring;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Expiry;

public class TokenCache {
    private final Cache<String, CachedToken> cache;

    public TokenCache(Duration maxTtl) {
        this.cache = Caffeine.newBuilder()
            .expireAfter(new CachedTokenExpiry(maxTtl))
            .build();
    }

    public Optional<CachedToken> get(String apiKey) {
        return Optional.ofNullable(cache.getIfPresent(apiKey));
    }

    public void put(String apiKey, CachedToken token) {
        cache.put(apiKey, token);
    }

    public record CachedToken(String accessToken, Map<String, Object> claims, Instant expiresAt) {}

    private static class CachedTokenExpiry implements Expiry<String, CachedToken> {
        private final Duration maxTtl;

        private CachedTokenExpiry(Duration maxTtl) {
            this.maxTtl = maxTtl;
        }

        @Override
        public long expireAfterCreate(String key, CachedToken value, long currentTime) {
            return nanosUntilExpiry(value);
        }

        @Override
        public long expireAfterUpdate(String key, CachedToken value, long currentTime, long currentDuration) {
            return nanosUntilExpiry(value);
        }

        @Override
        public long expireAfterRead(String key, CachedToken value, long currentTime, long currentDuration) {
            return currentDuration;
        }

        private long nanosUntilExpiry(CachedToken token) {
            Instant now = Instant.now();
            Instant expiresAt = token.expiresAt();
            Duration ttl = expiresAt != null ? Duration.between(now, expiresAt) : maxTtl;
            if (ttl.isNegative() || ttl.isZero()) {
                return 0L;
            }
            if (ttl.compareTo(maxTtl) > 0) {
                ttl = maxTtl;
            }
            return ttl.toNanos();
        }
    }
}
