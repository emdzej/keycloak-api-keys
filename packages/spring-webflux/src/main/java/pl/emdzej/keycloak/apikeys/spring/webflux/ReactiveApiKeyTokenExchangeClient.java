package pl.emdzej.keycloak.apikeys.spring.webflux;

import java.time.Duration;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

public class ReactiveApiKeyTokenExchangeClient {

    private static final String GRANT_TYPE = "urn:ietf:params:oauth:grant-type:api-key";

    private final WebClient webClient;

    public ReactiveApiKeyTokenExchangeClient(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<TokenExchangeResponse> exchange(String serverUrl, String realm,
                                                String clientId, String clientSecret,
                                                String apiKey) {
        String baseUrl = serverUrl.endsWith("/")
                ? serverUrl.substring(0, serverUrl.length() - 1)
                : serverUrl;
        String tokenUrl = baseUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", GRANT_TYPE);
        form.add("api_key", apiKey);
        form.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            form.add("client_secret", clientSecret);
        }

        return webClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(form))
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> body = (Map<String, Object>) response;
                    if (!body.containsKey("access_token")) {
                        throw new TokenExchangeException("Token exchange response missing access_token");
                    }
                    String accessToken = String.valueOf(body.get("access_token"));
                    Duration expiresIn = parseExpiresIn(body.get("expires_in"));
                    return new TokenExchangeResponse(accessToken, expiresIn);
                })
                .onErrorMap(WebClientResponseException.class,
                        ex -> new TokenExchangeException("Token exchange failed: " + ex.getStatusCode(), ex));
    }

    private Duration parseExpiresIn(Object value) {
        if (value instanceof Number n) {
            return n.longValue() > 0 ? Duration.ofSeconds(n.longValue()) : null;
        }
        if (value != null) {
            try {
                long seconds = Long.parseLong(String.valueOf(value));
                return seconds > 0 ? Duration.ofSeconds(seconds) : null;
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        return null;
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
