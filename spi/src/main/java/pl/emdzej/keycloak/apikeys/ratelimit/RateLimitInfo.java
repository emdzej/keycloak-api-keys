package pl.emdzej.keycloak.apikeys.ratelimit;

public record RateLimitInfo(
    int limit,
    int remaining,
    long resetAt
) {
}
