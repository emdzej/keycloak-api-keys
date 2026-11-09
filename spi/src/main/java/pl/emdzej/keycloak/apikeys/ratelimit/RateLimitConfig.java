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

public record RateLimitConfig(
    int perMinute,
    int perHour,
    int perDay,
    int burst
) {
    public static final int DEFAULT_PER_MINUTE = 60;
    public static final int DEFAULT_PER_HOUR = 1000;
    public static final int DEFAULT_PER_DAY = 10000;
    public static final int DEFAULT_BURST = 10;

    /**
     * Normalizes a resolved config for enforcement: {@code null} means defaults, and a
     * value {@code <= 0} disables that window (stored as {@code 0}).
     */
    public static RateLimitConfig normalize(RateLimitConfig config) {
        if (config == null) {
            return defaults();
        }
        return new RateLimitConfig(
            Math.max(config.perMinute(), 0),
            Math.max(config.perHour(), 0),
            Math.max(config.perDay(), 0),
            Math.max(config.burst(), 0)
        );
    }

    public static boolean isUnlimited(int limit) {
        return limit <= 0;
    }

    public static RateLimitConfig defaults() {
        return new RateLimitConfig(
            DEFAULT_PER_MINUTE,
            DEFAULT_PER_HOUR,
            DEFAULT_PER_DAY,
            DEFAULT_BURST
        );
    }
}
