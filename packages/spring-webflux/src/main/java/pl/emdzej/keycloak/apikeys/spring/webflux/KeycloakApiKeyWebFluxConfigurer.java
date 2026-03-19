package pl.emdzej.keycloak.apikeys.spring.webflux;

import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;

/**
 * Convenience configurer that registers {@link KeycloakApiKeyWebFilter} with a
 * {@link org.springframework.security.web.server.SecurityWebFilterChain}.
 *
 * <p>Usage:
 * <pre>{@code
 * @Bean
 * public SecurityWebFilterChain securityWebFilterChain(
 *         ServerHttpSecurity http,
 *         KeycloakApiKeyWebFluxConfigurer configurer) {
 *     configurer.configure(http);
 *     return http
 *         .authorizeExchange(ex -> ex
 *             .pathMatchers("/health").permitAll()
 *             .anyExchange().authenticated())
 *         .build();
 * }
 * }</pre>
 */
public class KeycloakApiKeyWebFluxConfigurer {

    private final KeycloakApiKeyWebFilter webFilter;

    public KeycloakApiKeyWebFluxConfigurer(KeycloakApiKeyWebFilter webFilter) {
        this.webFilter = webFilter;
    }

    public void configure(ServerHttpSecurity http) {
        http.addFilterBefore(webFilter, SecurityWebFiltersOrder.AUTHENTICATION);
    }

    public KeycloakApiKeyWebFilter getWebFilter() {
        return webFilter;
    }
}
