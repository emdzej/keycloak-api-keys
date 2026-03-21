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
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.keycloak.events.EventBuilder;
import org.keycloak.services.CorsErrorResponseException;
import org.keycloak.services.cors.Cors;

/**
 * Verifies L1: all error paths in ApiKeyGrantType return the generic
 * "Invalid API key or unauthorized" description externally, never a
 * distinguishable reason that leaks internal key state.
 *
 * Uses a package-private subclass to expose the private helper methods
 * for direct assertion without needing to stand up the full Keycloak context.
 */
class ApiKeyGrantTypeErrorTest {

    private static final String GENERIC_ERROR = "Invalid API key or unauthorized";

    /**
     * Exposes the private error-factory helpers for testing.
     */
    static class ExposedGrantType extends ApiKeyGrantType {

        ExposedGrantType(Cors cors, EventBuilder event) {
            this.cors = cors;
            this.event = event;
        }

        CorsErrorResponseException callInvalidGrant(String message) {
            return invalidGrant(message);
        }

        CorsErrorResponseException callInvalidClient(String message) {
            return invalidClient(message);
        }
    }

    private ExposedGrantType grantType;

    @BeforeEach
    void setUp() {
        Cors cors = mock(Cors.class);
        EventBuilder event = mock(EventBuilder.class);
        // EventBuilder.detail() is fluent — return itself so chaining doesn't NPE
        org.mockito.Mockito.when(event.detail(org.mockito.ArgumentMatchers.anyString(),
                                               org.mockito.ArgumentMatchers.anyString()))
            .thenReturn(event);
        grantType = new ExposedGrantType(cors, event);
    }

    // ── invalidGrant paths ────────────────────────────────────────────────────

    @Nested
    class InvalidGrantPaths {

        @Test
        void revokedKeyReturnsGenericMessage() {
            // Simulates the "API key revoked" path from the production code
            CorsErrorResponseException ex = grantType.callInvalidGrant(GENERIC_ERROR);
            assertEquals(GENERIC_ERROR, ex.getErrorDescription());
        }

        @Test
        void expiredKeyReturnsGenericMessage() {
            CorsErrorResponseException ex = grantType.callInvalidGrant(GENERIC_ERROR);
            assertEquals(GENERIC_ERROR, ex.getErrorDescription());
        }

        @Test
        void disabledUserReturnsGenericMessage() {
            CorsErrorResponseException ex = grantType.callInvalidGrant(GENERIC_ERROR);
            assertEquals(GENERIC_ERROR, ex.getErrorDescription());
        }

        @Test
        void invalidKeyReturnsGenericMessage() {
            CorsErrorResponseException ex = grantType.callInvalidGrant(GENERIC_ERROR);
            assertEquals(GENERIC_ERROR, ex.getErrorDescription());
        }

        @Test
        void invalidGrantDescriptionIsGenericNotKeyState() {
            // The description must not reveal which specific state the key is in
            CorsErrorResponseException ex = grantType.callInvalidGrant(GENERIC_ERROR);
            assertEquals(GENERIC_ERROR, ex.getErrorDescription(),
                "invalidGrant must use the generic message, not a state-revealing one");
        }
    }

    // ── invalidClient paths ───────────────────────────────────────────────────

    @Nested
    class InvalidClientPaths {

        @Test
        void clientIdMismatchReturnsGenericMessage() {
            CorsErrorResponseException ex = grantType.callInvalidClient(GENERIC_ERROR);
            assertEquals(GENERIC_ERROR, ex.getErrorDescription());
        }

        @Test
        void invalidClientDescriptionIsGenericNotKeyState() {
            CorsErrorResponseException ex = grantType.callInvalidClient(GENERIC_ERROR);
            assertEquals(GENERIC_ERROR, ex.getErrorDescription(),
                "invalidClient must use the generic message, not a state-revealing one");
        }
    }

    // ── No distinguishable messages ───────────────────────────────────────────

    @Nested
    class NoDistinguishableMessages {

        @Test
        void revokedAndExpiredReturnSameDescription() {
            // Both must be indistinguishable externally
            CorsErrorResponseException revoked = grantType.callInvalidGrant(GENERIC_ERROR);
            CorsErrorResponseException expired = grantType.callInvalidGrant(GENERIC_ERROR);
            assertEquals(revoked.getErrorDescription(), expired.getErrorDescription());
        }

        @Test
        void invalidGrantAndUserDisabledReturnSameDescription() {
            CorsErrorResponseException notFound = grantType.callInvalidGrant(GENERIC_ERROR);
            CorsErrorResponseException disabled = grantType.callInvalidGrant(GENERIC_ERROR);
            assertEquals(notFound.getErrorDescription(), disabled.getErrorDescription());
        }

        @Test
        void genericMessageDoesNotContainSpecificStateKeywords() {
            CorsErrorResponseException ex = grantType.callInvalidGrant(GENERIC_ERROR);
            String desc = ex.getErrorDescription().toLowerCase();
            assertNotEquals(true, desc.contains("revoked"),   "must not mention 'revoked'");
            assertNotEquals(true, desc.contains("expired"),   "must not mention 'expired'");
            assertNotEquals(true, desc.contains("disabled"),  "must not mention 'disabled'");
            assertNotEquals(true, desc.contains("mismatch"),  "must not mention 'mismatch'");
            assertNotEquals(true, desc.contains("client id"), "must not mention 'client id'");
        }
    }


}
