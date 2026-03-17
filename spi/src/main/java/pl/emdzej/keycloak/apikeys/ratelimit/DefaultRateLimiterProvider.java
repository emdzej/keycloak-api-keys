package pl.emdzej.keycloak.apikeys.ratelimit;

import org.jboss.logging.Logger;
import org.keycloak.connections.infinispan.InfinispanConnectionProvider;
import org.keycloak.models.KeycloakSession;

public class DefaultRateLimiterProvider implements RateLimiterProvider {
    private static final Logger LOGGER = Logger.getLogger(DefaultRateLimiterProvider.class);

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
                LOGGER.warn("Infinispan provider not available; falling back to in-memory rate limiter.");
                return new InMemoryRateLimiter();
            }
            return new InfinispanRateLimiter(session);
        } catch (Exception ex) {
            LOGGER.warn("Failed to initialize Infinispan rate limiter; falling back to in-memory.", ex);
            return new InMemoryRateLimiter();
        }
    }
}
