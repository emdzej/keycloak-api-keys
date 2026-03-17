package pl.emdzej.keycloak.apikeys.spring;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "keycloak.api-keys")
public record KeycloakApiKeyProperties(
    String serverUrl,
    String realm,
    String clientId,
    String clientSecret,
    String headerName,
    Duration cacheTtl
) {
    public KeycloakApiKeyProperties {
        if (headerName == null || headerName.isBlank()) {
            headerName = "X-API-Key";
        }
        if (cacheTtl == null) {
            cacheTtl = Duration.ofMinutes(5);
        }
    }
}
