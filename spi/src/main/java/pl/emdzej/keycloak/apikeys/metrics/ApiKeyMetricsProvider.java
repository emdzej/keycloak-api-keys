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
