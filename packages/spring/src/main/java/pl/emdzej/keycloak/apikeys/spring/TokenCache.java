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

package pl.emdzej.keycloak.apikeys.spring;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

/**
 * Token cache backed by Spring's {@link CacheManager} abstraction.
 *
 * <p>Uses the cache named {@value #CACHE_NAME}. The {@link CacheManager} bean is
 * provided by the application — in demos a {@code ConcurrentMapCacheManager} is
 * configured; in production any Spring-supported provider (Redis, Caffeine, etc.)
 * can be used without changing this class.
 *
 * <p>Because {@link org.springframework.cache.concurrent.ConcurrentMapCache} does
 * not support per-entry TTL, expiry is enforced at read time: stale entries are
 * evicted on access using the {@link CachedToken#expiresAt()} timestamp.
 * Cache providers that natively support TTL (e.g. Redis, Caffeine) will handle
 * eviction automatically in addition to this check.
 */
public class TokenCache {

    public static final String CACHE_NAME = "api-keys-tokens";

    private final Cache cache;

    public TokenCache(CacheManager cacheManager) {
        Cache resolved = cacheManager.getCache(CACHE_NAME);
        if (resolved == null) {
            throw new IllegalStateException(
                    "No cache named '" + CACHE_NAME + "' found in CacheManager. "
                    + "Ensure a cache with this name is configured.");
        }
        this.cache = resolved;
    }

    public Optional<CachedToken> get(String apiKey) {
        Cache.ValueWrapper wrapper = cache.get(apiKey);
        if (wrapper == null) {
            return Optional.empty();
        }
        CachedToken token = (CachedToken) wrapper.get();
        if (token == null) {
            return Optional.empty();
        }
        // Enforce TTL for providers that don't support per-entry expiry
        if (token.expiresAt() != null && token.expiresAt().isBefore(Instant.now())) {
            cache.evict(apiKey);
            return Optional.empty();
        }
        return Optional.of(token);
    }

    public void put(String apiKey, CachedToken token) {
        cache.put(apiKey, token);
    }

    public void evict(String apiKey) {
        cache.evict(apiKey);
    }

    public record CachedToken(String accessToken, Map<String, Object> claims, Instant expiresAt) {}
}
