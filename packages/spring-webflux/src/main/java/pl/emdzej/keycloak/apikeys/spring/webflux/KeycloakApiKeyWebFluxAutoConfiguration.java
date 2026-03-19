package pl.emdzej.keycloak.apikeys.spring.webflux;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication.Type;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.web.reactive.function.client.WebClient;

@AutoConfiguration
@ConditionalOnWebApplication(type = Type.REACTIVE)
@EnableConfigurationProperties(KeycloakApiKeyProperties.class)
public class KeycloakApiKeyWebFluxAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public WebClient keycloakWebClient() {
        return WebClient.builder().build();
    }

    @Bean
    @ConditionalOnMissingBean
    public ReactiveApiKeyTokenExchangeClient reactiveApiKeyTokenExchangeClient(WebClient keycloakWebClient) {
        return new ReactiveApiKeyTokenExchangeClient(keycloakWebClient);
    }

    @Bean
    @ConditionalOnMissingBean
    public ReactiveTokenCache reactiveTokenCache(CacheManager cacheManager) {
        return new ReactiveTokenCache(cacheManager);
    }

    @Bean
    @ConditionalOnMissingBean
    public KeycloakApiKeyWebFilter keycloakApiKeyWebFilter(
            KeycloakApiKeyProperties properties,
            ReactiveApiKeyTokenExchangeClient tokenExchangeClient,
            ReactiveTokenCache tokenCache) {
        return new KeycloakApiKeyWebFilter(properties, tokenExchangeClient, tokenCache);
    }

    @Bean
    @ConditionalOnMissingBean
    public KeycloakApiKeyWebFluxConfigurer keycloakApiKeyWebFluxConfigurer(
            KeycloakApiKeyWebFilter webFilter) {
        return new KeycloakApiKeyWebFluxConfigurer(webFilter);
    }
}
