package pl.emdzej.keycloak.apikeys.demo.webflux;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import pl.emdzej.keycloak.apikeys.spring.webflux.KeycloakApiKeyWebFluxConfigurer;

@Configuration
@EnableReactiveMethodSecurity
public class SecurityConfig {

    private final KeycloakApiKeyWebFluxConfigurer configurer;

    public SecurityConfig(KeycloakApiKeyWebFluxConfigurer configurer) {
        this.configurer = configurer;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        configurer.configure(http);

        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/health").permitAll()
                        .anyExchange().authenticated())
                .build();
    }
}
