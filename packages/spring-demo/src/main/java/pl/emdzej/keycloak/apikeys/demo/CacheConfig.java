package pl.emdzej.keycloak.apikeys.demo;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pl.emdzej.keycloak.apikeys.spring.TokenCache;

/**
 * Configures Spring's built-in {@link ConcurrentMapCacheManager} for the demo.
 *
 * <p>In production, replace this with any Spring-supported cache provider
 * (Redis, Caffeine, Hazelcast, etc.) — the middleware uses the {@link CacheManager}
 * abstraction and requires no code changes.
 *
 * <p>Note: {@link ConcurrentMapCacheManager} has no built-in TTL support.
 * The middleware enforces expiry at read time using the token's {@code exp} claim.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(TokenCache.CACHE_NAME);
    }
}
