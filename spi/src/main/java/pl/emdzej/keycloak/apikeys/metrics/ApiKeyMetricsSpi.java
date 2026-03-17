package pl.emdzej.keycloak.apikeys.metrics;

import org.keycloak.provider.ProviderFactory;
import org.keycloak.provider.Spi;

public class ApiKeyMetricsSpi implements Spi {
    @Override
    public boolean isInternal() {
        return false;
    }

    @Override
    public String getName() {
        return "apiKeyMetrics";
    }

    @Override
    public Class<?> getProviderClass() {
        return ApiKeyMetricsProvider.class;
    }

    @Override
    public Class<? extends ProviderFactory<?>> getProviderFactoryClass() {
        return ApiKeyMetricsProviderFactory.class;
    }
}
