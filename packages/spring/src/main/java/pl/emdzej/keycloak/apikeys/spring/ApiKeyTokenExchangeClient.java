package pl.emdzej.keycloak.apikeys.spring;

import java.net.URI;
import java.time.Duration;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

public class ApiKeyTokenExchangeClient {
    private static final String GRANT_TYPE = "urn:ietf:params:oauth:grant-type:api-key";

    private final RestTemplate restTemplate;

    public ApiKeyTokenExchangeClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public TokenExchangeResponse exchange(String serverUrl, String realm, String clientId, String clientSecret, String apiKey) {
        String baseUrl = serverUrl.endsWith("/") ? serverUrl.substring(0, serverUrl.length() - 1) : serverUrl;
        URI uri = URI.create(baseUrl + "/realms/" + realm + "/protocol/openid-connect/token");

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", GRANT_TYPE);
        form.add("api_key", apiKey);
        form.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            form.add("client_secret", clientSecret);
        }

        Map response;
        try {
            response = restTemplate.postForObject(uri, new org.springframework.http.HttpEntity<>(form, headers()), Map.class);
        } catch (RestClientException ex) {
            throw new TokenExchangeException("Token exchange failed", ex);
        }

        if (response == null || !response.containsKey("access_token")) {
            throw new TokenExchangeException("Token exchange response missing access_token");
        }

        String accessToken = String.valueOf(response.get("access_token"));
        long expiresInSeconds = 0L;
        Object expiresIn = response.get("expires_in");
        if (expiresIn instanceof Number number) {
            expiresInSeconds = number.longValue();
        } else if (expiresIn != null) {
            try {
                expiresInSeconds = Long.parseLong(String.valueOf(expiresIn));
            } catch (NumberFormatException ignored) {
                expiresInSeconds = 0L;
            }
        }

        Duration expiresInDuration = expiresInSeconds > 0 ? Duration.ofSeconds(expiresInSeconds) : null;
        return new TokenExchangeResponse(accessToken, expiresInDuration);
    }

    private org.springframework.http.HttpHeaders headers() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        return headers;
    }

    public record TokenExchangeResponse(String accessToken, Duration expiresIn) {}

    public static class TokenExchangeException extends RuntimeException {
        public TokenExchangeException(String message) {
            super(message);
        }

        public TokenExchangeException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
