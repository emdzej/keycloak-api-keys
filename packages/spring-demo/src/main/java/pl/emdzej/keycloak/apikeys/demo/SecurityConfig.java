package pl.emdzej.keycloak.apikeys.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import pl.emdzej.keycloak.apikeys.spring.KeycloakApiKeyConfigurer;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final KeycloakApiKeyConfigurer keycloakApiKeyConfigurer;

    public SecurityConfig(KeycloakApiKeyConfigurer keycloakApiKeyConfigurer) {
        this.keycloakApiKeyConfigurer = keycloakApiKeyConfigurer;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        keycloakApiKeyConfigurer.configure(http);

        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/health").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
