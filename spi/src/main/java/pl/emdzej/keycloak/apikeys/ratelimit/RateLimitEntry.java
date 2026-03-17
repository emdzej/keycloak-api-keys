package pl.emdzej.keycloak.apikeys.ratelimit;

import java.io.Serializable;

public record RateLimitEntry(
    long count,
    long windowStart,
    long windowDurationMs
) implements Serializable {
}
