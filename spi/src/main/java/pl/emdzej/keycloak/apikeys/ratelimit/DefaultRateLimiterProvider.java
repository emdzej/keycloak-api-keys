package pl.emdzej.keycloak.apikeys.ratelimit;

import org.jboss.logging.Logger;
import org.keycloak.connections.infinispan.InfinispanConnectionProvider;
import org.keycloak.models.KeycloakSession;

public class DefaultRateLimiterProvider implements RateLimiterProvider {
    private static final Logger LOGGER = Logger.getLogger(DefaultRateLimiterProvider.class);

    /** Realm attribute name for fail-closed mode (H4). */
    static final String FAIL_CLOSED_ATTR = "apiKeysRateLimitFailClosed";

    private final KeycloakSession session;
    private volatile RateLimiter rateLimiter;

    public DefaultRateLimiterProvider(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public RateLimiter getRateLimiter() {
        if (rateLimiter != null) {
            return rateLimiter;
        }
        synchronized (this) {
            if (rateLimiter != null) {
                return rateLimiter;
            }
            rateLimiter = createRateLimiter();
            return rateLimiter;
        }
    }

    @Override
    public void close() {
        // no-op
    }

    private RateLimiter createRateLimiter() {
        try {
            InfinispanConnectionProvider provider = session.getProvider(InfinispanConnectionProvider.class);
            if (provider == null) {
                LOGGER.warn("Infinispan provider not available; applying fail-closed policy.");
                return handleInfinispanUnavailable();
            }
            return new InfinispanRateLimiter(session);
        } catch (Exception ex) {
            LOGGER.warn("Failed to initialize Infinispan rate limiter; applying fail-closed policy.", ex);
            return handleInfinispanUnavailable();
        }
    }

    /**
     * Called whenever Infinispan is unavailable. Returns a {@link FailClosedRateLimiter}
     * (causes 503 on all exchanges) when {@code apiKeysRateLimitFailClosed=true} is set
     * on the realm, otherwise falls back to the per-node {@link InMemoryRateLimiter} (H4).
     */
    private RateLimiter handleInfinispanUnavailable() {
        if (isFailClosedEnabled()) {
            LOGGER.error("Infinispan unavailable and fail-closed mode is active " +
                         "(realm attribute '" + FAIL_CLOSED_ATTR + "'=true). " +
                         "All API key exchanges will be rejected with 503 until cache recovers.");
            return new FailClosedRateLimiter();
        }
        LOGGER.warn("Infinispan unavailable; falling back to in-memory rate limiter (per-node only). " +
                    "Set realm attribute '" + FAIL_CLOSED_ATTR + "'=true to enable fail-closed mode.");
        return new InMemoryRateLimiter();
    }

    private boolean isFailClosedEnabled() {
        try {
            org.keycloak.models.RealmModel realm = session.getContext().getRealm();
            if (realm == null) return false;
            String attr = realm.getAttribute(FAIL_CLOSED_ATTR);
            return "true".equalsIgnoreCase(attr != null ? attr.trim() : null);
        } catch (Exception ex) {
            LOGGER.warn("Could not read fail-closed realm attribute; defaulting to false.", ex);
            return false;
        }
    }
}
