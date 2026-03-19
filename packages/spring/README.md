# keycloak-api-keys-spring

Spring Security (MVC / servlet) integration for Keycloak API key authentication.
Validates API keys by exchanging them for JWT tokens at the Keycloak token endpoint
and sets the decoded claims on the `SecurityContext`.

## Installation

```kotlin
// build.gradle.kts
implementation("pl.emdzej.keycloak:keycloak-api-keys-spring:0.1.0")
```

## Usage

### 1. Configure the filter

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           KeycloakApiKeyConfigurer configurer) throws Exception {
        configurer.configure(http);
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/health").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

### 2. Configure a `CacheManager`

The library requires a `CacheManager` bean with a cache named `api-keys-tokens`.
For development and demos, Spring's built-in `ConcurrentMapCacheManager` requires
no extra dependencies:

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(TokenCache.CACHE_NAME); // "api-keys-tokens"
    }
}
```

### 3. Configure `application.yml`

```yaml
keycloak:
  api-keys:
    server-url: https://keycloak.example.com
    realm: my-realm
    client-id: my-app
    # client-secret: xxx   # only for confidential clients
    header-name: X-API-Key # optional, default: X-API-Key
    cache-ttl: PT5M         # optional, default: PT5M
```

### 4. Access claims in a route handler

```java
@GetMapping("/api/profile")
public Map<String, Object> profile(Authentication authentication) {
    ApiKeyAuthenticationToken token = (ApiKeyAuthenticationToken) authentication;
    Map<String, Object> claims = token.getClaims();
    String userId = (String) claims.get("sub");
    String apiKeyId = (String) claims.get("api_key_id");
    // ...
}
```

## Configuration properties

| Property | Env variable | Default | Description |
|----------|-------------|---------|-------------|
| `keycloak.api-keys.server-url` | `KEYCLOAK_URL` | — | Keycloak base URL |
| `keycloak.api-keys.realm` | `KEYCLOAK_REALM` | — | Realm name |
| `keycloak.api-keys.client-id` | `CLIENT_ID` | — | OAuth2 client ID |
| `keycloak.api-keys.client-secret` | `CLIENT_SECRET` | `null` | Omit for public clients |
| `keycloak.api-keys.header-name` | `API_KEY_HEADER` | `X-API-Key` | Request header to read the key from |
| `keycloak.api-keys.cache-ttl` | `CACHE_TTL` | `PT5M` | Maximum cache TTL as ISO 8601 duration |

The filter also accepts the API key via `Authorization: ApiKey <key>` in addition to
the configured header.

## `ApiKeyAuthenticationToken`

| Method | Returns |
|--------|---------|
| `getClaims()` | `Map<String, Object>` — full JWT claim map |
| `getPrincipal()` | `Map<String, Object>` — same as `getClaims()` |
| `getName()` | `sub` claim value |
| `getAuthorities()` | Realm roles as `ROLE_<roleName>` Spring authorities |

## Behavior

- **Missing API key** → passes through to the next filter (Spring Security handles 401)
- **Invalid / expired API key** → `401 Unauthorized`
- **Rate limited** → `429 Too Many Requests` (rate limit headers forwarded from Keycloak)

## Caching

The library uses Spring's `CacheManager` abstraction. The cache name is
`TokenCache.CACHE_NAME` (`"api-keys-tokens"`). Expiry is enforced at read time
using the token's `exp` claim, so the cache works correctly even with providers
that don't support per-entry TTL (like `ConcurrentMapCacheManager`).

### Swapping the cache provider in production

No code changes are needed in the middleware — just provide a different `CacheManager` bean.

**Redis** (with per-entry TTL):
```java
@Bean
public CacheManager cacheManager(RedisConnectionFactory factory) {
    RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
        .entryTtl(Duration.ofMinutes(5));
    return RedisCacheManager.builder(factory)
        .withCacheConfiguration(TokenCache.CACHE_NAME, config)
        .build();
}
```

**Caffeine** (in-process, with TTL):
```java
@Bean
public CacheManager cacheManager() {
    CaffeineCacheManager manager = new CaffeineCacheManager(TokenCache.CACHE_NAME);
    manager.setCaffeine(Caffeine.newBuilder().expireAfterWrite(Duration.ofMinutes(5)));
    return manager;
}
```

**Hazelcast / other distributed cache**: configure via the standard Spring Boot
auto-configuration for that provider — as long as a `CacheManager` bean is present
with a cache named `"api-keys-tokens"`, the middleware will use it.
