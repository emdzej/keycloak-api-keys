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
