package pl.emdzej.keycloak.apikeys.spring;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@AutoConfiguration
@EnableConfigurationProperties(KeycloakApiKeyProperties.class)
public class KeycloakApiKeyAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    @ConditionalOnMissingBean
    public ApiKeyTokenExchangeClient apiKeyTokenExchangeClient(RestTemplate restTemplate) {
        return new ApiKeyTokenExchangeClient(restTemplate);
    }

    @Bean
    @ConditionalOnMissingBean
    public TokenCache tokenCache(CacheManager cacheManager) {
        return new TokenCache(cacheManager);
    }

    @Bean
    @ConditionalOnMissingBean
    public KeycloakApiKeyFilter keycloakApiKeyFilter(
            KeycloakApiKeyProperties properties,
            ApiKeyTokenExchangeClient tokenExchangeClient,
            TokenCache tokenCache) {
        return new KeycloakApiKeyFilter(properties, tokenExchangeClient, tokenCache);
    }

    @Bean
    @ConditionalOnMissingBean
    public KeycloakApiKeyConfigurer keycloakApiKeyConfigurer(KeycloakApiKeyFilter filter) {
        return new KeycloakApiKeyConfigurer(filter);
    }
}
