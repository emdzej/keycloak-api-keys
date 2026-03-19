package pl.emdzej.keycloak.apikeys;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class ApiKeyHasherTest {

    private static final byte[] PEPPER = "test-pepper-32-bytes-minimum!!!!".getBytes(StandardCharsets.UTF_8);

    // ── Legacy plain SHA-256 (backward compat) ────────────────────────────────

    @Nested
    class PlainHash {

        @Test
        void producesHexStringOf64Chars() {
            assertEquals(64, ApiKeyHasher.hash("mk_live_abc123").length());
        }

        @Test
        void isDeterministic() {
            assertEquals(ApiKeyHasher.hash("key"), ApiKeyHasher.hash("key"));
        }

        @Test
        void differentKeysProduceDifferentHashes() {
            assertNotEquals(ApiKeyHasher.hash("key-a"), ApiKeyHasher.hash("key-b"));
        }
    }

    // ── HMAC-SHA-256 (L3) ─────────────────────────────────────────────────────

    @Nested
    class HmacHash {

        @Test
        void producesHexStringOf64Chars() {
            assertEquals(64, ApiKeyHasher.hmacHash("mk_live_abc123", PEPPER).length());
        }

        @Test
        void isDeterministicForSamePepper() {
            assertEquals(
                ApiKeyHasher.hmacHash("key", PEPPER),
                ApiKeyHasher.hmacHash("key", PEPPER));
        }

        @Test
        void differentKeysProduceDifferentHashes() {
            assertNotEquals(
                ApiKeyHasher.hmacHash("key-a", PEPPER),
                ApiKeyHasher.hmacHash("key-b", PEPPER));
        }

        @Test
        void differentPeppersProduceDifferentHashes() {
            byte[] pepper2 = "other-pepper!!!!!!!!!!!!!!!!!!!!".getBytes(StandardCharsets.UTF_8);
            assertNotEquals(
                ApiKeyHasher.hmacHash("key", PEPPER),
                ApiKeyHasher.hmacHash("key", pepper2),
                "Same key with different pepper must produce different HMAC");
        }

        @Test
        void hmacDiffersFromPlainSha256() {
            assertNotEquals(
                ApiKeyHasher.hash("key"),
                ApiKeyHasher.hmacHash("key", PEPPER),
                "HMAC hash must differ from plain SHA-256 so legacy keys cannot be confused");
        }

        @Test
        void rejectsNullPepper() {
            assertThrows(IllegalArgumentException.class,
                () -> ApiKeyHasher.hmacHash("key", null));
        }

        @Test
        void rejectsEmptyPepper() {
            assertThrows(IllegalArgumentException.class,
                () -> ApiKeyHasher.hmacHash("key", new byte[0]));
        }
    }

    // ── hashForLookup dispatch ────────────────────────────────────────────────

    @Nested
    class HashForLookup {

        @Test
        void returnsHmacWhenPepperProvided() {
            String expected = ApiKeyHasher.hmacHash("key", PEPPER);
            assertEquals(expected, ApiKeyHasher.hashForLookup("key", PEPPER));
        }

        @Test
        void returnsPlainSha256WhenNoPepper() {
            String expected = ApiKeyHasher.hash("key");
            assertEquals(expected, ApiKeyHasher.hashForLookup("key", null),
                "Without pepper, hashForLookup must fall back to plain SHA-256");
        }

        @Test
        void returnsPlainSha256WhenEmptyPepper() {
            String expected = ApiKeyHasher.hash("key");
            assertEquals(expected, ApiKeyHasher.hashForLookup("key", new byte[0]));
        }
    }

    // ── Key generation ────────────────────────────────────────────────────────

    @Nested
    class KeyGeneration {

        @Test
        void generatedKeyHasCorrectPrefix() {
            ApiKeyHasher.GeneratedKey key = ApiKeyHasher.generate("mk_live");
            assertTrue(key.plainKey().startsWith("mk_live_"));
        }

        @Test
        void hashIs64HexChars() {
            ApiKeyHasher.GeneratedKey key = ApiKeyHasher.generate("mk_live");
            assertEquals(64, key.hash().length());
        }

        @Test
        void plainKeyAndHashDiffer() {
            ApiKeyHasher.GeneratedKey key = ApiKeyHasher.generate("prefix");
            assertNotEquals(key.plainKey(), key.hash());
        }

        @Test
        void twoGenerationsProduceDifferentKeys() {
            ApiKeyHasher.GeneratedKey a = ApiKeyHasher.generate("pfx");
            ApiKeyHasher.GeneratedKey b = ApiKeyHasher.generate("pfx");
            assertNotEquals(a.plainKey(), b.plainKey());
            assertNotEquals(a.hash(), b.hash());
        }
    }
}
