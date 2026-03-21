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

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

public class ApiKeyMetrics {
    public static final String KEY_COUNT_METRIC = "keycloak_api_keys_total";
    public static final String EXCHANGE_TOTAL_METRIC = "keycloak_api_keys_exchanges_total";
    public static final String EXCHANGE_DURATION_METRIC = "keycloak_api_keys_exchange_duration_seconds";
    public static final String RATE_LIMITED_METRIC = "keycloak_api_keys_rate_limited_total";

    private final MeterRegistry registry;
    private final Map<String, AtomicLong> gauges = new ConcurrentHashMap<>();

    public ApiKeyMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    public void recordExchange(String realm, String client, String result, long durationMs) {
        Counter.builder(EXCHANGE_TOTAL_METRIC)
            .tag("realm", safe(realm))
            .tag("client", safe(client))
            .tag("result", safe(result))
            .register(registry)
            .increment();

        Timer.builder(EXCHANGE_DURATION_METRIC)
            .tag("realm", safe(realm))
            .tag("client", safe(client))
            .publishPercentileHistogram()
            .register(registry)
            .record(durationMs, TimeUnit.MILLISECONDS);
    }

    public void recordRateLimited(String realm, String client) {
        Counter.builder(RATE_LIMITED_METRIC)
            .tag("realm", safe(realm))
            .tag("client", safe(client))
            .register(registry)
            .increment();
    }

    public void updateKeyCount(String realm, String client, String status, long count) {
        String key = safe(realm) + ":" + safe(client) + ":" + safe(status);
        AtomicLong value = gauges.computeIfAbsent(key, ignored -> {
            AtomicLong gaugeValue = new AtomicLong(0L);
            Gauge.builder(KEY_COUNT_METRIC, gaugeValue, AtomicLong::get)
                .tag("realm", safe(realm))
                .tag("client", safe(client))
                .tag("status", safe(status))
                .register(registry);
            return gaugeValue;
        });
        value.set(count);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "unknown" : value;
    }
}
