package pl.emdzej.keycloak.apikeys.ratelimit;

public record RateLimitConfig(
    int perMinute,
    int perHour,
    int perDay,
    int burst
) {
    public static final int DEFAULT_PER_MINUTE = 60;
    public static final int DEFAULT_PER_HOUR = 1000;
    public static final int DEFAULT_PER_DAY = 10000;
    public static final int DEFAULT_BURST = 10;

    public static RateLimitConfig defaults() {
        return new RateLimitConfig(
            DEFAULT_PER_MINUTE,
            DEFAULT_PER_HOUR,
            DEFAULT_PER_DAY,
            DEFAULT_BURST
        );
    }
}
