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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

class KeycloakApiKeyWebFilterTest {

    @Test
    void keycloakRateLimitBecomes429WithForwardedHeaders() {
        KeycloakApiKeyWebFilter filter = filterRespondingWith(ClientResponse.create(HttpStatus.TOO_MANY_REQUESTS)
            .header("Retry-After", "42")
            .header("X-RateLimit-Remaining", "0")
            .build());

        MockServerWebExchange exchange = exchangeWithKey();
        filter.filter(exchange, ex -> Mono.empty()).block();

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exchange.getResponse().getStatusCode());
        assertEquals("42", exchange.getResponse().getHeaders().getFirst("Retry-After"));
        assertEquals("0", exchange.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"));
    }

    @Test
    void invalidKeyIsStill401() {
        KeycloakApiKeyWebFilter filter = filterRespondingWith(ClientResponse.create(HttpStatus.BAD_REQUEST).build());

        MockServerWebExchange exchange = exchangeWithKey();
        filter.filter(exchange, ex -> Mono.empty()).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void realmRolesFromRealmAccessBecomeAuthorities() {
        KeycloakApiKeyWebFilter filter = filterRespondingWith(ClientResponse.create(HttpStatus.OK)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .body("{\"access_token\":\"" + jwt() + "\",\"expires_in\":300}")
            .build());
        AtomicReference<Authentication> seen = new AtomicReference<>();

        filter.filter(exchangeWithKey(), ex -> ReactiveSecurityContextHolder.getContext()
            .map(SecurityContext::getAuthentication)
            .doOnNext(seen::set)
            .then()).block();

        assertNotNull(seen.get());
        var authorities = seen.get().getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
        assertTrue(authorities.contains("ROLE_reports-reader"), authorities.toString());
        assertTrue(authorities.contains("ROLE_admin"), authorities.toString());
    }

    private static KeycloakApiKeyWebFilter filterRespondingWith(ClientResponse response) {
        WebClient webClient = WebClient.builder().exchangeFunction(request -> Mono.just(response)).build();
        return new KeycloakApiKeyWebFilter(
            new KeycloakApiKeyProperties("http://kc", "r", "my-app", null, "X-API-Key", Duration.ofMinutes(5)),
            new ReactiveApiKeyTokenExchangeClient(webClient),
            new ReactiveTokenCache(new ConcurrentMapCacheManager(ReactiveTokenCache.CACHE_NAME)));
    }

    private static MockServerWebExchange exchangeWithKey() {
        return MockServerWebExchange.from(MockServerHttpRequest.get("/api/x").header("X-API-Key", "myapp_key"));
    }

    /** Unsigned JWT with realm roles in the standard Keycloak claim. */
    static String jwt() {
        String payload = "{\"sub\":\"user-1\",\"api_key_id\":\"key-1\",\"exp\":" + (System.currentTimeMillis() / 1000 + 300)
            + ",\"realm_access\":{\"roles\":[\"reports-reader\",\"ROLE_admin\"]}}";
        java.util.Base64.Encoder b64 = java.util.Base64.getUrlEncoder().withoutPadding();
        return b64.encodeToString("{\"alg\":\"none\"}".getBytes()) + "." + b64.encodeToString(payload.getBytes()) + ".sig";
    }
}
