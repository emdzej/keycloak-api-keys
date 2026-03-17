package pl.emdzej.keycloak.apikeys.spring;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

public class KeycloakApiKeyConfigurer {
    private final KeycloakApiKeyFilter filter;

    public KeycloakApiKeyConfigurer(KeycloakApiKeyFilter filter) {
        this.filter = filter;
    }

    public void configure(HttpSecurity http) throws Exception {
        http.addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class);
    }
}
