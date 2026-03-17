package pl.emdzej.keycloak.apikeys;

import org.junit.jupiter.api.Test;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ApiKeyEntityTest {
    @Test
    void shouldCreateEntityWithDefaults() {
        ApiKeyEntity entity = new ApiKeyEntity(
            "hash",
            "mk_live",
            "Test Key",
            "user-1",
            "client-1",
            "realm-1"
        );

        assertNotNull(entity.getId());
        assertEquals(0, entity.getUsageCount());
        assertNotNull(entity.getCreatedAt());
    }

    @Test
    void shouldValidateRequiredFields() {
        assertThrows(IllegalArgumentException.class, () -> new ApiKeyEntity(
            "",
            "mk_live",
            "Test Key",
            "user-1",
            "client-1",
            "realm-1"
        ));
    }

    @Test
    void shouldValidatePrefixLength() {
        assertThrows(IllegalArgumentException.class, () -> new ApiKeyEntity(
            "hash",
            "this-prefix-is-way-too-long",
            "Test Key",
            "user-1",
            "client-1",
            "realm-1"
        ));
    }
}
