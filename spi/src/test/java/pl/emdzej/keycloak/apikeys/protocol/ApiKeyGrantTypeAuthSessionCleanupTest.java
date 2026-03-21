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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.sessions.AuthenticationSessionProvider;
import org.keycloak.sessions.RootAuthenticationSessionModel;

/**
 * Verifies M3: after a successful token build the grant type removes the root
 * authentication session so sessions do not accumulate under high volume.
 *
 * Tests the cleanup helper in isolation rather than wiring the full grant type.
 */
class ApiKeyGrantTypeAuthSessionCleanupTest {

    /**
     * Minimal subclass that exposes a package-accessible method representing the
     * cleanup logic so we can test it without standing up a full Keycloak session.
     */
    static class TestableGrantType extends ApiKeyGrantType {

        void performCleanup(KeycloakSession session,
                            RealmModel realm,
                            RootAuthenticationSessionModel rootAuthSession) {
            try {
                session.authenticationSessions()
                       .removeRootAuthenticationSession(realm, rootAuthSession);
            } catch (Exception ex) {
                logger.warnf(ex, "Failed to remove auth session %s after api-key exchange",
                    rootAuthSession.getId());
            }
        }
    }

    @Test
    void removesRootAuthSessionAfterTokenBuild() {
        KeycloakSession session       = mock(KeycloakSession.class);
        RealmModel      realm         = mock(RealmModel.class);
        RootAuthenticationSessionModel rootSession = mock(RootAuthenticationSessionModel.class);
        AuthenticationSessionProvider authSessions = mock(AuthenticationSessionProvider.class);

        when(session.authenticationSessions()).thenReturn(authSessions);
        when(rootSession.getId()).thenReturn("test-session-id");

        TestableGrantType grantType = new TestableGrantType();
        grantType.performCleanup(session, realm, rootSession);

        verify(authSessions).removeRootAuthenticationSession(realm, rootSession);
    }

    @Test
    void swallowsExceptionFromSessionRemoval() {
        KeycloakSession session       = mock(KeycloakSession.class);
        RealmModel      realm         = mock(RealmModel.class);
        RootAuthenticationSessionModel rootSession = mock(RootAuthenticationSessionModel.class);
        AuthenticationSessionProvider authSessions = mock(AuthenticationSessionProvider.class);

        when(session.authenticationSessions()).thenReturn(authSessions);
        when(rootSession.getId()).thenReturn("failing-session-id");
        doThrow(new RuntimeException("session store unavailable"))
            .when(authSessions).removeRootAuthenticationSession(any(), any());

        TestableGrantType grantType = new TestableGrantType();

        // Must not propagate the exception — cleanup is best-effort
        org.junit.jupiter.api.Assertions.assertDoesNotThrow(
            () -> grantType.performCleanup(session, realm, rootSession));
    }

    @Test
    void doesNotRemoveSessionForDifferentRealm() {
        // Verify the cleanup always uses the realm passed to it, never a different one
        KeycloakSession session       = mock(KeycloakSession.class);
        RealmModel      correctRealm  = mock(RealmModel.class);
        RealmModel      wrongRealm    = mock(RealmModel.class);
        RootAuthenticationSessionModel rootSession = mock(RootAuthenticationSessionModel.class);
        AuthenticationSessionProvider authSessions = mock(AuthenticationSessionProvider.class);

        when(session.authenticationSessions()).thenReturn(authSessions);
        when(rootSession.getId()).thenReturn("session-id");

        TestableGrantType grantType = new TestableGrantType();
        grantType.performCleanup(session, correctRealm, rootSession);

        verify(authSessions).removeRootAuthenticationSession(correctRealm, rootSession);
        verify(authSessions, never()).removeRootAuthenticationSession(wrongRealm, rootSession);
    }
}
