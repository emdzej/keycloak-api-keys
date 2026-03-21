/*
 * Copyright (c) 2026 Michał Jaskólski and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
