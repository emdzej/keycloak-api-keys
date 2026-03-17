package pl.emdzej.keycloak.apikeys

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity

class ApiKeyEntityTest {
    @Test
    fun `should create entity with defaults`() {
        val entity = ApiKeyEntity(
            keyHash = "hash",
            keyPrefix = "mk_live",
            name = "Test Key",
            userId = "user-1",
            clientId = "client-1",
            realmId = "realm-1"
        )

        assertNotNull(entity.id)
        assertEquals(0, entity.usageCount)
        assertNotNull(entity.createdAt)
    }

    @Test
    fun `should validate required fields`() {
        assertThrows(IllegalArgumentException::class.java) {
            ApiKeyEntity(
                keyHash = "",
                keyPrefix = "mk_live",
                name = "Test Key",
                userId = "user-1",
                clientId = "client-1",
                realmId = "realm-1"
            )
        }
    }

    @Test
    fun `should validate prefix length`() {
        assertThrows(IllegalArgumentException::class.java) {
            ApiKeyEntity(
                keyHash = "hash",
                keyPrefix = "this-prefix-is-way-too-long",
                name = "Test Key",
                userId = "user-1",
                clientId = "client-1",
                realmId = "realm-1"
            )
        }
    }
}
