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

package pl.emdzej.keycloak.apikeys;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Hashing and generation utilities for API keys.
 *
 * <h2>Hash algorithm (L3)</h2>
 * New keys are hashed with {@code HMAC-SHA-256(pepper, key)} where the pepper is a
 * server-side secret loaded from the environment variable {@code API_KEY_PEPPER}.
 * This means a database dump alone is not sufficient to brute-force stored hashes.
 *
 * <h2>Transition / backward compatibility</h2>
 * Keys created before L3 are stored as plain {@code SHA-256(key)} hashes.  The lookup
 * path ({@link #hashForLookup}) tries HMAC first and, when the pepper is unavailable,
 * falls back to plain SHA-256 so existing keys keep working.  After all pre-L3 keys
 * have been rotated the plain-SHA-256 fallback should be removed.
 */
public final class ApiKeyHasher {

    /** Environment variable name for the HMAC pepper (L3). */
    public static final String PEPPER_ENV_VAR = "API_KEY_PEPPER";

    private static final SecureRandom RANDOM   = new SecureRandom();
    private static final String       ALPHABET =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private ApiKeyHasher() {}

    // ── Pepper resolution ─────────────────────────────────────────────────────

    /**
     * Returns the raw pepper bytes from the {@code API_KEY_PEPPER} environment variable,
     * or {@code null} if the variable is unset or blank.
     *
     * Callers that require a pepper (new key creation) should treat {@code null} as a
     * configuration error in production; callers performing lookup should fall back to
     * plain SHA-256 during the transition period.
     */
    public static byte[] resolvePepper() {
        String pepper = System.getenv(PEPPER_ENV_VAR);
        if (pepper == null || pepper.isBlank()) {
            return null;
        }
        return pepper.getBytes(StandardCharsets.UTF_8);
    }

    // ── Hashing ───────────────────────────────────────────────────────────────

    /**
     * Computes {@code HMAC-SHA-256(pepper, key)} and returns the hex-encoded digest (L3).
     *
     * @throws IllegalArgumentException if pepper is null or empty
     */
    public static String hmacHash(String key, byte[] pepper) {
        if (pepper == null || pepper.length == 0) {
            throw new IllegalArgumentException("Pepper must not be null or empty");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(pepper, "HmacSHA256"));
            byte[] bytes = mac.doFinal(key.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(bytes);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to HMAC-hash api key", e);
        }
    }

    /**
     * Legacy plain {@code SHA-256(key)} — kept for backward-compatibility lookups.
     * New code should use {@link #hmacHash} when a pepper is available.
     */
    public static String hash(String key) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(key.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(bytes);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to hash api key", e);
        }
    }

    /**
     * Returns the hash to use when <em>looking up</em> a key presented by a caller.
     *
     * <ul>
     *   <li>When a pepper is configured: returns {@code HMAC-SHA-256(pepper, key)}.
     *       New keys are stored under this hash so this is the fast path.</li>
     *   <li>When no pepper is configured: returns plain {@code SHA-256(key)} for
     *       backward compatibility with pre-L3 keys (transition period only).</li>
     * </ul>
     *
     * The {@link ApiKeyService} tries the HMAC hash first; if nothing is found <em>and</em>
     * a pepper exists, it does a second lookup with plain SHA-256 and re-hashes on a match,
     * transparently upgrading legacy entries.
     */
    public static String hashForLookup(String key, byte[] pepper) {
        if (pepper != null && pepper.length > 0) {
            return hmacHash(key, pepper);
        }
        return hash(key);
    }

    // ── Key generation ────────────────────────────────────────────────────────

    /**
     * Generates a new random key and its hash.
     * Uses HMAC when a pepper is available; plain SHA-256 otherwise.
     */
    public static GeneratedKey generate(String prefix) {
        StringBuilder randomPart = new StringBuilder(64);
        for (int i = 0; i < 64; i++) {
            randomPart.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        String plainKey = prefix + "_" + randomPart;
        byte[] pepper = resolvePepper();
        String hash = (pepper != null) ? hmacHash(plainKey, pepper) : hash(plainKey);
        return new GeneratedKey(plainKey, hash);
    }

    // ── Hex encoding ──────────────────────────────────────────────────────────

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    public record GeneratedKey(String plainKey, String hash) {}
}
