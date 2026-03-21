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

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class InMemoryRateLimiter implements RateLimiter {
    private static final long CLEANUP_INTERVAL_MS = 60_000L;
    private static final long ENTRY_TTL_SECONDS = 86_400L;

    private final Map<String, Entry> entries = new ConcurrentHashMap<>();
    private final AtomicLong lastCleanup = new AtomicLong(0L);

    @Override
    public void updateConfig(String keyId, RateLimitConfig config) {
        RateLimitConfig normalized = normalize(config);
        entries.compute(keyId, (id, entry) -> {
            if (entry == null) {
                return new Entry(normalized);
            }
            entry.updateConfig(normalized);
            return entry;
        });
    }

    @Override
    public boolean tryAcquire(String keyId) {
        cleanupIfNeeded();
        Entry entry = entries.computeIfAbsent(keyId, id -> new Entry(RateLimitConfig.defaults()));
        return entry.tryAcquire();
    }

    @Override
    public RateLimitInfo getInfo(String keyId) {
        cleanupIfNeeded();
        Entry entry = entries.computeIfAbsent(keyId, id -> new Entry(RateLimitConfig.defaults()));
        return entry.getInfo();
    }

    @Override
    public void reset(String keyId) {
        entries.remove(keyId);
    }

    @Override
    public boolean isHealthy() {
        return true;
    }

    private void cleanupIfNeeded() {
        long now = System.currentTimeMillis();
        long last = lastCleanup.get();
        if (now - last < CLEANUP_INTERVAL_MS) {
            return;
        }
        if (!lastCleanup.compareAndSet(last, now)) {
            return;
        }
        long cutoff = Instant.ofEpochMilli(now).minusSeconds(ENTRY_TTL_SECONDS).getEpochSecond();
        entries.entrySet().removeIf(entry -> entry.getValue().lastAccessEpochSeconds() < cutoff);
    }

    private RateLimitConfig normalize(RateLimitConfig config) {
        RateLimitConfig defaults = RateLimitConfig.defaults();
        if (config == null) {
            return defaults;
        }
        return new RateLimitConfig(
            config.perMinute() > 0 ? config.perMinute() : defaults.perMinute(),
            config.perHour() > 0 ? config.perHour() : defaults.perHour(),
            config.perDay() > 0 ? config.perDay() : defaults.perDay(),
            config.burst() > 0 ? config.burst() : defaults.burst()
        );
    }

    private static class Entry {
        private RateLimitConfig config;
        private Bucket minuteBucket;
        private Bucket hourBucket;
        private Bucket dayBucket;
        private Bucket burstBucket;
        private volatile long lastAccessEpochSeconds;

        private Entry(RateLimitConfig config) {
            updateConfig(config);
        }

        private synchronized void updateConfig(RateLimitConfig newConfig) {
            if (newConfig.equals(this.config)) {
                return; // config unchanged — preserve existing bucket counters (H3)
            }
            this.config = newConfig;
            long nowNanos = System.nanoTime();
            this.minuteBucket = new Bucket(newConfig.perMinute(), 60.0, nowNanos);
            this.hourBucket = new Bucket(newConfig.perHour(), 3600.0, nowNanos);
            this.dayBucket = new Bucket(newConfig.perDay(), 86_400.0, nowNanos);
            this.burstBucket = new Bucket(newConfig.burst(), 60.0, nowNanos);
            this.lastAccessEpochSeconds = Instant.now().getEpochSecond();
        }

        private synchronized boolean tryAcquire() {
            long nowNanos = System.nanoTime();
            refillAll(nowNanos);
            if (!hasTokens()) {
                touch();
                return false;
            }
            minuteBucket.consume();
            hourBucket.consume();
            dayBucket.consume();
            burstBucket.consume();
            touch();
            return true;
        }

        private synchronized RateLimitInfo getInfo() {
            long nowNanos = System.nanoTime();
            refillAll(nowNanos);
            int remaining = (int) Math.floor(Math.min(
                Math.min(minuteBucket.tokens(), hourBucket.tokens()),
                Math.min(dayBucket.tokens(), burstBucket.tokens())
            ));
            long resetAt = computeResetAt(nowNanos);
            touch();
            return new RateLimitInfo(config.perMinute(), Math.max(remaining, 0), resetAt);
        }

        private long computeResetAt(long nowNanos) {
            double waitSeconds = Math.max(
                Math.max(minuteBucket.timeToTokens(1.0), hourBucket.timeToTokens(1.0)),
                Math.max(dayBucket.timeToTokens(1.0), burstBucket.timeToTokens(1.0))
            );
            long nowSeconds = Instant.now().getEpochSecond();
            long wait = (long) Math.ceil(waitSeconds);
            return nowSeconds + Math.max(wait, 0);
        }

        private void refillAll(long nowNanos) {
            minuteBucket.refill(nowNanos);
            hourBucket.refill(nowNanos);
            dayBucket.refill(nowNanos);
            burstBucket.refill(nowNanos);
        }

        private boolean hasTokens() {
            return minuteBucket.hasToken()
                && hourBucket.hasToken()
                && dayBucket.hasToken()
                && burstBucket.hasToken();
        }

        private void touch() {
            lastAccessEpochSeconds = Instant.now().getEpochSecond();
        }

        private long lastAccessEpochSeconds() {
            return lastAccessEpochSeconds;
        }
    }

    private static class Bucket {
        private final double capacity;
        private final double refillPerSecond;
        private double tokens;
        private long lastRefillNanos;

        private Bucket(int capacity, double windowSeconds, long nowNanos) {
            this.capacity = capacity;
            this.refillPerSecond = capacity / windowSeconds;
            this.tokens = capacity;
            this.lastRefillNanos = nowNanos;
        }

        private void refill(long nowNanos) {
            if (nowNanos <= lastRefillNanos) {
                return;
            }
            double deltaSeconds = (nowNanos - lastRefillNanos) / 1_000_000_000.0;
            double newTokens = tokens + (deltaSeconds * refillPerSecond);
            tokens = Math.min(capacity, newTokens);
            lastRefillNanos = nowNanos;
        }

        private boolean hasToken() {
            return tokens >= 1.0;
        }

        private void consume() {
            if (tokens >= 1.0) {
                tokens -= 1.0;
            }
        }

        private double tokens() {
            return tokens;
        }

        private double timeToTokens(double target) {
            if (tokens >= target) {
                return 0.0;
            }
            if (refillPerSecond <= 0) {
                return Double.POSITIVE_INFINITY;
            }
            return (target - tokens) / refillPerSecond;
        }
    }
}
