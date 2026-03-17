package pl.emdzej.keycloak.apikeys.metrics;

import org.keycloak.provider.Provider;

public class ApiKeyMetricsProvider implements Provider {
    private final ApiKeyMetrics metrics;

    public ApiKeyMetricsProvider(ApiKeyMetrics metrics) {
        this.metrics = metrics;
    }

    public ApiKeyMetrics getMetrics() {
        return metrics;
    }

    @Override
    public void close() {
        // no-op
    }
}
