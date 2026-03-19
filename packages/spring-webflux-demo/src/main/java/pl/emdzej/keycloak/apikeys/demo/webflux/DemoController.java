package pl.emdzej.keycloak.apikeys.demo.webflux;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import pl.emdzej.keycloak.apikeys.spring.webflux.ApiKeyAuthenticationToken;
import reactor.core.publisher.Mono;

@RestController
public class DemoController {

    @GetMapping("/health")
    public Mono<Map<String, String>> health() {
        return Mono.just(Map.of("status", "ok", "middleware", "spring-webflux"));
    }

    @GetMapping("/api/profile")
    public Mono<Map<String, Object>> profile(Authentication authentication) {
        @SuppressWarnings("unchecked")
        Map<String, Object> claims = (authentication instanceof ApiKeyAuthenticationToken token)
                ? (Map<String, Object>) token.getPrincipal()
                : Map.of();

        return Mono.just(Map.of(
                "message", "Hello from Spring WebFlux!",
                "user", Map.of(
                        "sub", claims.getOrDefault("sub", ""),
                        "azp", claims.getOrDefault("azp", ""),
                        "apiKeyId", claims.getOrDefault("api_key_id", ""),
                        "scope", claims.getOrDefault("scope", ""),
                        "authorities", authentication.getAuthorities().stream()
                                .map(a -> a.getAuthority()).toList()
                )
        ));
    }

    @GetMapping("/api/data")
    public Mono<Map<String, Object>> data() {
        return Mono.just(Map.of(
                "items", List.of(
                        Map.of("id", 1, "name", "Widget A", "price", 9.99),
                        Map.of("id", 2, "name", "Widget B", "price", 19.99),
                        Map.of("id", 3, "name", "Widget C", "price", 29.99)
                )
        ));
    }

    @PostMapping("/api/echo")
    public Mono<Map<String, Object>> echo(@RequestBody Map<String, Object> body,
                                          Authentication authentication) {
        return Mono.just(Map.of(
                "received", body,
                "authenticatedAs", authentication.getName()
        ));
    }
}
