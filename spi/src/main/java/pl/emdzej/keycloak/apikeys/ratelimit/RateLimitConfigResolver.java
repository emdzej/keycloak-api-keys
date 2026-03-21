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

package pl.emdzej.keycloak.apikeys.ratelimit;

import java.util.Map;
import org.keycloak.models.ClientModel;
import org.keycloak.models.RealmModel;
import org.keycloak.util.JsonSerialization;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;

public class RateLimitConfigResolver {
    public static final String ATTR_RATE_LIMITS = "apiKeysRateLimits";
    public static final String ATTR_PER_MINUTE = "apiKeysRateLimitPerMinute";
    public static final String ATTR_PER_HOUR = "apiKeysRateLimitPerHour";
    public static final String ATTR_PER_DAY = "apiKeysRateLimitPerDay";
    public static final String ATTR_BURST = "apiKeysRateLimitBurst";

    public RateLimitConfig resolve(RealmModel realm, ClientModel client, ApiKeyEntity apiKey) {
        RateLimitConfig defaults = RateLimitConfig.defaults();

        ConfigPart keyConfig = parseConfig(apiKey != null ? apiKey.getRateLimitConfigJson() : null);
        ConfigPart clientConfig = parseConfig(client != null ? client.getAttribute(ATTR_RATE_LIMITS) : null);
        ConfigPart realmConfig = parseConfig(realm != null ? realm.getAttribute(ATTR_RATE_LIMITS) : null);

        if (client != null) {
            clientConfig = clientConfig.withFallback(readAttributeConfig(client.getAttribute(ATTR_PER_MINUTE),
                client.getAttribute(ATTR_PER_HOUR),
                client.getAttribute(ATTR_PER_DAY),
                client.getAttribute(ATTR_BURST)));
        }

        if (realm != null) {
            realmConfig = realmConfig.withFallback(readAttributeConfig(realm.getAttribute(ATTR_PER_MINUTE),
                realm.getAttribute(ATTR_PER_HOUR),
                realm.getAttribute(ATTR_PER_DAY),
                realm.getAttribute(ATTR_BURST)));
        }

        return new RateLimitConfig(
            firstNonNull(keyConfig.perMinute, clientConfig.perMinute, realmConfig.perMinute, defaults.perMinute()),
            firstNonNull(keyConfig.perHour, clientConfig.perHour, realmConfig.perHour, defaults.perHour()),
            firstNonNull(keyConfig.perDay, clientConfig.perDay, realmConfig.perDay, defaults.perDay()),
            firstNonNull(keyConfig.burst, clientConfig.burst, realmConfig.burst, defaults.burst())
        );
    }

    private ConfigPart readAttributeConfig(String perMinute, String perHour, String perDay, String burst) {
        return new ConfigPart(
            parseInt(perMinute),
            parseInt(perHour),
            parseInt(perDay),
            parseInt(burst)
        );
    }

    private ConfigPart parseConfig(String json) {
        if (json == null || json.isBlank()) {
            return ConfigPart.empty();
        }
        try {
            Map<?, ?> raw = JsonSerialization.readValue(json, Map.class);
            if (raw == null) {
                return ConfigPart.empty();
            }
            Object maybeNested = raw.get("rateLimits");
            if (maybeNested instanceof Map<?, ?> nested) {
                raw = nested;
            }
            return new ConfigPart(
                readInt(raw, "perMinute"),
                readInt(raw, "perHour"),
                readInt(raw, "perDay"),
                readInt(raw, "burst")
            );
        } catch (Exception ignored) {
            return ConfigPart.empty();
        }
    }

    private Integer readInt(Map<?, ?> raw, String key) {
        Object value = raw.get(key);
        return parseInt(value);
    }

    private Integer parseInt(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private record ConfigPart(Integer perMinute, Integer perHour, Integer perDay, Integer burst) {
        static ConfigPart empty() {
            return new ConfigPart(null, null, null, null);
        }

        ConfigPart withFallback(ConfigPart fallback) {
            if (fallback == null) {
                return this;
            }
            return new ConfigPart(
                perMinute != null ? perMinute : fallback.perMinute,
                perHour != null ? perHour : fallback.perHour,
                perDay != null ? perDay : fallback.perDay,
                burst != null ? burst : fallback.burst
            );
        }
    }
}
