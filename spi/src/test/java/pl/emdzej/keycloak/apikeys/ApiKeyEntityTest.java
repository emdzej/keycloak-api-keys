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
