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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class KeycloakApiKeyFilterTest {

    private static final String TOKEN_URL = "http://kc/realms/r/protocol/openid-connect/token";

    private MockRestServiceServer keycloak;
    private KeycloakApiKeyFilter filter;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        keycloak = MockRestServiceServer.bindTo(restTemplate).build();
        filter = new KeycloakApiKeyFilter(
            new KeycloakApiKeyProperties("http://kc", "r", "my-app", null, "X-API-Key", Duration.ofMinutes(5)),
            new ApiKeyTokenExchangeClient(restTemplate),
            new TokenCache(new ConcurrentMapCacheManager(TokenCache.CACHE_NAME)));
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void keycloakRateLimitBecomes429WithForwardedHeaders() throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Retry-After", "42");
        headers.add("X-RateLimit-Limit", "5");
        headers.add("X-RateLimit-Remaining", "0");
        keycloak.expect(requestTo(TOKEN_URL)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).headers(headers));

        MockHttpServletResponse response = run("myapp_key", new AtomicReference<>());

        assertEquals(429, response.getStatus());
        assertEquals("42", response.getHeader("Retry-After"));
        assertEquals("5", response.getHeader("X-RateLimit-Limit"));
        assertEquals("0", response.getHeader("X-RateLimit-Remaining"));
    }

    @Test
    void invalidKeyIsStill401() throws Exception {
        keycloak.expect(requestTo(TOKEN_URL)).andRespond(withStatus(HttpStatus.BAD_REQUEST));

        assertEquals(401, run("myapp_bad", new AtomicReference<>()).getStatus());
    }

    @Test
    void realmRolesFromRealmAccessBecomeAuthorities() throws Exception {
        keycloak.expect(requestTo(TOKEN_URL)).andRespond(withSuccess(
            "{\"access_token\":\"" + jwt() + "\",\"expires_in\":300}", MediaType.APPLICATION_JSON));
        AtomicReference<Authentication> seen = new AtomicReference<>();

        MockHttpServletResponse response = run("myapp_good", seen);

        assertEquals(200, response.getStatus());
        assertNotNull(seen.get());
        var authorities = seen.get().getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
        assertTrue(authorities.contains("ROLE_reports-reader"), authorities.toString());
        assertTrue(authorities.contains("ROLE_admin"), "existing ROLE_ prefix kept as-is: " + authorities);
    }

    private MockHttpServletResponse run(String apiKey, AtomicReference<Authentication> seen) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/x");
        request.addHeader("X-API-Key", apiKey);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response,
            (req, res) -> seen.set(SecurityContextHolder.getContext().getAuthentication()));
        return response;
    }

    /** Unsigned JWT with realm roles in the standard Keycloak claim. */
    static String jwt() {
        String payload = "{\"sub\":\"user-1\",\"api_key_id\":\"key-1\",\"exp\":" + (System.currentTimeMillis() / 1000 + 300)
            + ",\"realm_access\":{\"roles\":[\"reports-reader\",\"ROLE_admin\"]}}";
        java.util.Base64.Encoder b64 = java.util.Base64.getUrlEncoder().withoutPadding();
        return b64.encodeToString("{\"alg\":\"none\"}".getBytes()) + "." + b64.encodeToString(payload.getBytes()) + ".sig";
    }
}
