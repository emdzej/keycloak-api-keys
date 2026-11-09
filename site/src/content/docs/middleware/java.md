---
title: Java / Spring
description: Protect Spring MVC and Spring WebFlux APIs with Keycloak API keys.
---

Two Spring Security integrations with the same configuration properties. Both auto-configure through Spring Boot, exchange the key at Keycloak's token endpoint, and put the decoded claims on the `SecurityContext`.

| Artifact | Stack |
|----------|-------|
| `pl.emdzej.keycloak:keycloak-api-keys-spring` | Spring MVC (servlet) |
| `pl.emdzej.keycloak:keycloak-api-keys-spring-webflux` | Spring WebFlux (reactive, non-blocking `WebClient`) |

Both are built against Spring Boot 4 and Spring Security 7.

## Installation

### Gradle

```kotlin
implementation("pl.emdzej.keycloak:keycloak-api-keys-spring:0.2.0")
// or
implementation("pl.emdzej.keycloak:keycloak-api-keys-spring-webflux:0.2.0")
```

### Maven

```xml
<dependency>
  <groupId>pl.emdzej.keycloak</groupId>
  <artifactId>keycloak-api-keys-spring</artifactId>
  <version>0.2.0</version>
</dependency>
```

## Configuration

```yaml
# application.yml
keycloak:
  api-keys:
    server-url: https://auth.example.com
    realm: my-realm
    client-id: my-app
    client-secret: ${CLIENT_SECRET}   # omit for public clients
    header-name: X-API-Key            # optional
    cache-ttl: PT5M                   # optional, ISO 8601 duration
```

| Property | Env variable | Default | Description |
|----------|--------------|---------|-------------|
| `keycloak.api-keys.server-url` | `KEYCLOAK_URL` | — | Keycloak base URL |
| `keycloak.api-keys.realm` | `KEYCLOAK_REALM` | — | Realm name |
| `keycloak.api-keys.client-id` | `CLIENT_ID` | — | Client the keys were issued for |
| `keycloak.api-keys.client-secret` | `CLIENT_SECRET` | — | Omit for public clients |
| `keycloak.api-keys.header-name` | `API_KEY_HEADER` | `X-API-Key` | Header to read the key from |
| `keycloak.api-keys.cache-ttl` | `CACHE_TTL` | `PT5M` | Max time to cache a successful exchange |

The key is read from the configured header, or from `Authorization: ApiKey <key>`.

## Spring MVC

Apply the auto-configured `KeycloakApiKeyConfigurer` to your filter chain:

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           KeycloakApiKeyConfigurer configurer) throws Exception {
        configurer.configure(http);
        return http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/health").permitAll()
                .anyRequest().authenticated())
            .build();
    }
}
```

## Spring WebFlux

```java
@Configuration
@EnableReactiveMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http,
                                                         KeycloakApiKeyWebFluxConfigurer configurer) {
        configurer.configure(http);
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(ex -> ex
                .pathMatchers("/health").permitAll()
                .anyExchange().authenticated())
            .build();
    }
}
```

## Cache

Both libraries cache exchanges through Spring's `CacheManager`, so you need a `CacheManager` bean with a cache named `api-keys-tokens` (`TokenCache.CACHE_NAME` for MVC, `ReactiveTokenCache.CACHE_NAME` for WebFlux).

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(TokenCache.CACHE_NAME);
    }
}
```

Expiry is checked at read time against the token's `exp` claim, so even a cache without per-entry TTL, like `ConcurrentMapCacheManager`, never returns a stale token. For production, any provider works (Caffeine, Redis, Hazelcast) as long as it exposes that cache name:

```java
@Bean
public CacheManager cacheManager(RedisConnectionFactory factory) {
    var config = RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(5));
    return RedisCacheManager.builder(factory)
        .withCacheConfiguration(TokenCache.CACHE_NAME, config)
        .build();
}
```

## Reading claims

The authenticated principal is an `ApiKeyAuthenticationToken`:

```java
@GetMapping("/api/profile")
public Map<String, Object> profile(Authentication authentication) {
    var auth = (ApiKeyAuthenticationToken) authentication;
    Map<String, Object> claims = auth.getClaims();
    return Map.of(
        "userId", auth.getName(),            // sub
        "apiKeyId", claims.get("api_key_id"));
}
```

| Method | Returns |
|--------|---------|
| `getClaims()` / `getPrincipal()` | Full JWT claim map |
| `getName()` | `sub` claim, the key owner's user ID |
| `getAuthorities()` | Realm roles granted to the key, as `ROLE_<name>` |

Because roles become standard authorities, method security works as usual:

```java
@PreAuthorize("hasRole('reports-reader')")
@GetMapping("/api/reports")
public List<Report> reports() { ... }
```

## Responses

| Situation | Result |
|-----------|--------|
| No key | Request continues unauthenticated, and your rules decide (usually `401`) |
| Unknown, revoked or expired key, or wrong client | `401 Unauthorized` |
| Rate limit exceeded | `429 Too Many Requests` with `Retry-After` and `X-RateLimit-*` headers forwarded from Keycloak |

Because a request without a key simply passes through, you can put API key auth in the same chain as other mechanisms, such as JWT bearer tokens.
