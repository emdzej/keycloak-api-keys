package pl.emdzej.keycloak.apikeys;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApiKeyHasherTest {
    @Test
    void shouldHashKeyWithSha256() {
        String hash = ApiKeyHasher.hash("mk_live_abc123");
        assertEquals(64, hash.length());
    }

    @Test
    void shouldGenerateKeyAndHash() {
        ApiKeyHasher.GeneratedKey generated = ApiKeyHasher.generate("mk_live");
        assertTrue(generated.plainKey().startsWith("mk_live_"));
        assertEquals(64, generated.hash().length());
        assertNotEquals(generated.plainKey(), generated.hash());
    }
}
