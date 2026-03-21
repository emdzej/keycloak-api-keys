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

package pl.emdzej.keycloak.apikeys.spring.webflux;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Reactive {@link WebFilter} that authenticates requests using an API key.
 *
 * <p>The key is read from the {@code X-API-Key} header (configurable) or from
 * {@code Authorization: ApiKey <key>}. On a cache miss the key is exchanged for a
 * JWT at the Keycloak token endpoint using {@link ReactiveApiKeyTokenExchangeClient}.
 * The decoded JWT claims are stored in a {@link ReactiveTokenCache} and set on the
 * reactive {@link org.springframework.security.core.context.SecurityContext} via
 * {@link ReactiveSecurityContextHolder}.
 */
public class KeycloakApiKeyWebFilter implements WebFilter, Ordered {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    // Run just before Spring Security's WebFilterChainProxy (-100)
    public static final int ORDER = -101;

    private final KeycloakApiKeyProperties properties;
    private final ReactiveApiKeyTokenExchangeClient tokenExchangeClient;
    private final ReactiveTokenCache tokenCache;

    public KeycloakApiKeyWebFilter(KeycloakApiKeyProperties properties,
                                   ReactiveApiKeyTokenExchangeClient tokenExchangeClient,
                                   ReactiveTokenCache tokenCache) {
        this.properties = properties;
        this.tokenExchangeClient = tokenExchangeClient;
        this.tokenCache = tokenCache;
    }

    @Override
    public int getOrder() {
        return ORDER;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String apiKey = extractApiKey(exchange);
        if (apiKey == null || apiKey.isBlank()) {
            return chain.filter(exchange);
        }

        return resolveAuthentication(apiKey)
                .flatMap(authentication ->
                        chain.filter(exchange)
                                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication)))
                .onErrorResume(ReactiveApiKeyTokenExchangeClient.TokenExchangeException.class,
                        ex -> unauthorized(exchange, "invalid_api_key", ex.getMessage()))
                .onErrorResume(IllegalArgumentException.class,
                        ex -> unauthorized(exchange, "invalid_token", "Unable to parse token"));
    }

    private Mono<ApiKeyAuthenticationToken> resolveAuthentication(String apiKey) {
        return tokenCache.get(apiKey)
                .filter(cached -> cached.expiresAt() == null || cached.expiresAt().isAfter(Instant.now()))
                .map(Mono::just)
                .orElseGet(() -> exchangeAndCache(apiKey))
                .map(cached -> {
                    Collection<? extends GrantedAuthority> authorities = extractAuthorities(cached.claims());
                    return new ApiKeyAuthenticationToken(cached.claims(), authorities);
                });
    }

    private Mono<ReactiveTokenCache.CachedToken> exchangeAndCache(String apiKey) {
        return tokenExchangeClient.exchange(
                        properties.serverUrl(),
                        properties.realm(),
                        properties.clientId(),
                        properties.clientSecret(),
                        apiKey)
                .map(response -> {
                    Map<String, Object> claims = decodeClaims(response.accessToken());
                    Instant expiresAt = extractExpiry(claims, response.expiresIn());
                    ReactiveTokenCache.CachedToken cached =
                            new ReactiveTokenCache.CachedToken(response.accessToken(), claims, expiresAt);
                    tokenCache.put(apiKey, cached);
                    return cached;
                });
    }

    private String extractApiKey(ServerWebExchange exchange) {
        HttpHeaders headers = exchange.getRequest().getHeaders();

        String headerValue = headers.getFirst(properties.headerName());
        if (headerValue != null && !headerValue.isBlank()) {
            return headerValue.trim();
        }

        String authorization = headers.getFirst(HttpHeaders.AUTHORIZATION);
        if (authorization != null) {
            String value = authorization.trim();
            if (value.toLowerCase().startsWith("apikey ")) {
                return value.substring("apikey ".length()).trim();
            }
        }

        return null;
    }

    private Map<String, Object> decodeClaims(String jwt) {
        String[] parts = jwt.split("\\.");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid JWT token");
        }
        byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
        String payload = new String(decoded, StandardCharsets.UTF_8);
        try {
            return OBJECT_MAPPER.readValue(payload, MAP_TYPE);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid JWT payload", ex);
        }
    }

    private Instant extractExpiry(Map<String, Object> claims, java.time.Duration fallback) {
        Object exp = claims.get("exp");
        if (exp instanceof Number n) {
            return Instant.ofEpochSecond(n.longValue());
        }
        if (exp != null) {
            try {
                return Instant.ofEpochSecond(Long.parseLong(String.valueOf(exp)));
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        return fallback != null ? Instant.now().plus(fallback) : null;
    }

    private Collection<? extends GrantedAuthority> extractAuthorities(Map<String, Object> claims) {
        Object roles = claims.get("roles");
        if (roles instanceof Collection<?> collection) {
            return collection.stream()
                    .map(String::valueOf)
                    .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toSet());
        }
        if (roles instanceof String roleString) {
            return List.of(new SimpleGrantedAuthority(
                    roleString.startsWith("ROLE_") ? roleString : "ROLE_" + roleString));
        }
        return Collections.emptyList();
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String error, String description) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"error\":\"" + error + "\",\"error_description\":\"" + description + "\"}";
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
    }
}
