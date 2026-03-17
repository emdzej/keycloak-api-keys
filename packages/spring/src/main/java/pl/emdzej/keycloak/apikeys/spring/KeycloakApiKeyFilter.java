package pl.emdzej.keycloak.apikeys.spring;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.filter.OncePerRequestFilter;

public class KeycloakApiKeyFilter extends OncePerRequestFilter {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final KeycloakApiKeyProperties properties;
    private final ApiKeyTokenExchangeClient tokenExchangeClient;
    private final TokenCache tokenCache;

    public KeycloakApiKeyFilter(
        KeycloakApiKeyProperties properties,
        ApiKeyTokenExchangeClient tokenExchangeClient,
        TokenCache tokenCache
    ) {
        this.properties = properties;
        this.tokenExchangeClient = tokenExchangeClient;
        this.tokenCache = tokenCache;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKey = extractApiKey(request);
        if (apiKey == null || apiKey.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            TokenCache.CachedToken cachedToken = tokenCache.get(apiKey)
                .filter(token -> token.expiresAt() == null || token.expiresAt().isAfter(Instant.now()))
                .orElseGet(() -> exchangeAndCache(apiKey));

            Map<String, Object> claims = cachedToken.claims();
            Collection<? extends GrantedAuthority> authorities = extractAuthorities(claims);
            AbstractAuthenticationToken authentication = new ApiKeyAuthenticationToken(claims, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (ApiKeyTokenExchangeClient.TokenExchangeException ex) {
            unauthorized(response, "invalid_api_key", ex.getMessage());
        } catch (Exception ex) {
            unauthorized(response, "invalid_token", "Unable to parse token");
        }
    }

    private TokenCache.CachedToken exchangeAndCache(String apiKey) {
        ApiKeyTokenExchangeClient.TokenExchangeResponse exchangeResponse = tokenExchangeClient.exchange(
            properties.serverUrl(),
            properties.realm(),
            properties.clientId(),
            properties.clientSecret(),
            apiKey
        );

        String accessToken = exchangeResponse.accessToken();
        Map<String, Object> claims = decodeClaims(accessToken);
        Instant expiresAt = extractExpiry(claims, exchangeResponse.expiresIn());
        TokenCache.CachedToken cachedToken = new TokenCache.CachedToken(accessToken, claims, expiresAt);
        tokenCache.put(apiKey, cachedToken);
        return cachedToken;
    }

    private String extractApiKey(HttpServletRequest request) {
        String headerValue = request.getHeader(properties.headerName());
        if (headerValue != null && !headerValue.isBlank()) {
            return headerValue.trim();
        }

        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization != null) {
            String value = authorization.trim();
            if (value.toLowerCase().startsWith("apikey ")) {
                return value.substring("apikey ".length()).trim();
            }
        }

        return null;
    }

    private Map<String, Object> decodeClaims(String jwt) {
        String[] parts = jwt.split("\\.");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid JWT token");
        }
        byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
        String payload = new String(decoded, StandardCharsets.UTF_8);
        try {
            return OBJECT_MAPPER.readValue(payload, MAP_TYPE);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Invalid JWT payload", ex);
        }
    }

    private Instant extractExpiry(Map<String, Object> claims, Duration fallback) {
        Object exp = claims.get("exp");
        if (exp instanceof Number number) {
            return Instant.ofEpochSecond(number.longValue());
        }
        if (exp != null) {
            try {
                return Instant.ofEpochSecond(Long.parseLong(String.valueOf(exp)));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        if (fallback != null) {
            return Instant.now().plus(fallback);
        }
        return null;
    }

    private Collection<? extends GrantedAuthority> extractAuthorities(Map<String, Object> claims) {
        Object roles = claims.get("roles");
        if (roles instanceof Collection<?> collection) {
            return collection.stream()
                .map(String::valueOf)
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
        }
        if (roles instanceof String roleString) {
            return List.of(new SimpleGrantedAuthority(roleString.startsWith("ROLE_") ? roleString : "ROLE_" + roleString));
        }
        return Collections.emptyList();
    }

    private void unauthorized(HttpServletResponse response, String error, String description) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + error + "\",\"error_description\":\"" + description + "\"}");
    }
}
