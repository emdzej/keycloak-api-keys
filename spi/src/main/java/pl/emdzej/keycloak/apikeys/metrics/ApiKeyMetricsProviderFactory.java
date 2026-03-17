package pl.emdzej.keycloak.apikeys.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Metrics;
import org.keycloak.Config;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderFactory;

public class ApiKeyMetricsProviderFactory implements ProviderFactory<ApiKeyMetricsProvider> {
    public static final String ID = "default";

    private volatile ApiKeyMetrics metrics;

    @Override
    public ApiKeyMetricsProvider create(KeycloakSession session) {
        return new ApiKeyMetricsProvider(getMetrics());
    }

    @Override
    public void init(Config.Scope config) {
        // no-op
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
        getMetrics();
    }

    @Override
    public void close() {
        // no-op
    }

    @Override
    public String getId() {
        return ID;
    }

    private ApiKeyMetrics getMetrics() {
        ApiKeyMetrics current = metrics;
        if (current != null) {
            return current;
        }
        synchronized (this) {
            if (metrics == null) {
                MeterRegistry registry = Metrics.globalRegistry;
                metrics = new ApiKeyMetrics(registry);
            }
            return metrics;
        }
    }
}
