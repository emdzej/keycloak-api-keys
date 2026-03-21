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

package pl.emdzej.keycloak.apikeys.demo.webflux;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pl.emdzej.keycloak.apikeys.spring.webflux.ReactiveTokenCache;

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
        return new ConcurrentMapCacheManager(ReactiveTokenCache.CACHE_NAME);
    }
}
