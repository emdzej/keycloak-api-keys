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

package pl.emdzej.keycloak.apikeys.protocol;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Method;
import java.util.Set;
import org.junit.jupiter.api.Test;

/**
 * Guards the {@code getTokenParameterNames()} signature, which Keycloak 26.6.4+ invokes on every grant.
 * It cannot be checked at compile time while building against older Keycloak, so verify it here.
 */
class ApiKeyGrantTypeCompatTest {

    @Test
    void exposesTokenParameterNamesWithKeycloakSignature() throws Exception {
        Method method = ApiKeyGrantType.class.getMethod("getTokenParameterNames");
        assertEquals(Set.class, method.getReturnType());
    }

    @Test
    void apiKeyIsNotTreatedAsTokenParameter() {
        assertTrue(new ApiKeyGrantType().getTokenParameterNames().isEmpty());
    }
}
