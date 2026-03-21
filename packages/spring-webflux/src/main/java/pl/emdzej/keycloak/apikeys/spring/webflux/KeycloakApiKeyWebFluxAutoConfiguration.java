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
