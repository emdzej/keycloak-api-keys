package pl.emdzej.keycloak.apikeys.jpa;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

/**
 * Verifies M2: ApiKeyEntity carries a @Version field for optimistic locking.
 * The version field must exist, be readable, and default to 0 on new entities.
 */
class ApiKeyEntityVersionTest {

    @Test
    void newEntityHasVersionFieldDefaultingToZero() throws Exception {
        ApiKeyEntity entity = new ApiKeyEntity(
            "hash", "pfx_", "Name", "user-1", "client-1", "realm-1");

        // Access via reflection — the field is package-private / private with no getter yet
        java.lang.reflect.Field versionField = ApiKeyEntity.class.getDeclaredField("version");
        versionField.setAccessible(true);
        long version = (long) versionField.get(entity);

        assertEquals(0L, version, "@Version field must default to 0 on a new entity");
    }

    @Test
    void versionFieldAnnotatedWithVersion() throws Exception {
        java.lang.reflect.Field versionField = ApiKeyEntity.class.getDeclaredField("version");
        assertNotNull(versionField.getAnnotation(jakarta.persistence.Version.class),
            "version field must be annotated with @Version for JPA optimistic locking");
    }

    @Test
    void versionFieldAnnotatedWithColumn() throws Exception {
        java.lang.reflect.Field versionField = ApiKeyEntity.class.getDeclaredField("version");
        jakarta.persistence.Column col = versionField.getAnnotation(jakarta.persistence.Column.class);
        assertNotNull(col, "version field must have @Column annotation");
        assertEquals("version", col.name());
    }
}
