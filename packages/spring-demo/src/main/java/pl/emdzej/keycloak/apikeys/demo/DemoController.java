package pl.emdzej.keycloak.apikeys.demo;

import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import pl.emdzej.keycloak.apikeys.spring.ApiKeyAuthenticationToken;

@RestController
public class DemoController {

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "middleware", "spring");
    }

    @GetMapping("/api/profile")
    public Map<String, Object> profile(Authentication authentication) {
        @SuppressWarnings("unchecked")
        Map<String, Object> claims = (authentication instanceof ApiKeyAuthenticationToken token)
            ? (Map<String, Object>) token.getPrincipal()
            : Map.of();
        return Map.of(
            "message", "Hello from Spring!",
            "user", Map.of(
                "sub", claims.getOrDefault("sub", ""),
                "azp", claims.getOrDefault("azp", ""),
                "apiKeyId", claims.getOrDefault("api_key_id", ""),
                "scope", claims.getOrDefault("scope", ""),
                "authorities", authentication.getAuthorities().stream()
                    .map(a -> a.getAuthority()).toList()
            )
        );
    }

    @GetMapping("/api/data")
    public Map<String, Object> data() {
        return Map.of(
            "items", List.of(
                Map.of("id", 1, "name", "Widget A", "price", 9.99),
                Map.of("id", 2, "name", "Widget B", "price", 19.99),
                Map.of("id", 3, "name", "Widget C", "price", 29.99)
            )
        );
    }

    @PostMapping("/api/echo")
    public Map<String, Object> echo(@RequestBody Map<String, Object> body, Authentication authentication) {
        return Map.of(
            "received", body,
            "authenticatedAs", authentication.getName()
        );
    }
}
