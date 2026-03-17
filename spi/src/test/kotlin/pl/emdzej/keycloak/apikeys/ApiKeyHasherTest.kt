package pl.emdzej.keycloak.apikeys

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class ApiKeyHasherTest {
    @Test
    fun `should hash key with SHA-256`() {
        val hash = ApiKeyHasher.hash("mk_live_abc123")
        assertEquals(64, hash.length)
    }

    @Test
    fun `should generate key and hash`() {
        val (plainKey, hash) = ApiKeyHasher.generate("mk_live")
        assertTrue(plainKey.startsWith("mk_live_"))
        assertEquals(64, hash.length)
        assertNotEquals(plainKey, hash)
    }
}
