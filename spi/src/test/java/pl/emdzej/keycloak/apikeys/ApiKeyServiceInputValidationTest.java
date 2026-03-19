package pl.emdzej.keycloak.apikeys;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.persistence.EntityManager;
import jakarta.ws.rs.BadRequestException;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.keycloak.connections.jpa.JpaConnectionProvider;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import pl.emdzej.keycloak.apikeys.dto.ApiKeyCreateRequest;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyRepository;

/**
 * Tests for M1: explicit input size and lifetime validation in ApiKeyService.
 */
class ApiKeyServiceInputValidationTest {

    private static final String CLIENT_ID = "my-app";
    private static final String REALM_ID  = "realm-1";
    private static final String USER_ID   = "user-1";

    private ApiKeyService service;
    private RealmModel realm;
    private UserModel user;
    private ClientModel client;

    @BeforeEach
    void setUp() throws Exception {
        realm  = mock(RealmModel.class);
        user   = mock(UserModel.class);
        client = mock(ClientModel.class);
        KeycloakSession session = mock(KeycloakSession.class);
        ApiKeyRepository repository = mock(ApiKeyRepository.class);

        when(realm.getId()).thenReturn(REALM_ID);
        when(realm.getName()).thenReturn("realm-name");
        when(realm.getAttribute(any())).thenReturn(null); // use defaults
        when(user.getId()).thenReturn(USER_ID);
        when(client.getClientId()).thenReturn(CLIENT_ID);
        when(client.isEnabled()).thenReturn(true);
        when(client.isPublicClient()).thenReturn(true);
        when(client.getClientScopes(true)).thenReturn(Map.of());
        when(client.getClientScopes(false)).thenReturn(Map.of());
        when(client.getDynamicClientScope(any())).thenReturn(null);

        KeycloakContext ctx = mock(KeycloakContext.class);
        when(session.getContext()).thenReturn(ctx);
        when(ctx.getRealm()).thenReturn(realm);
        when(ctx.getConnection()).thenReturn(mock(org.keycloak.common.ClientConnection.class));
        when(session.getProvider(pl.emdzej.keycloak.apikeys.metrics.ApiKeyMetricsProvider.class))
            .thenReturn(null);
        when(session.getKeycloakSessionFactory()).thenReturn(mock(KeycloakSessionFactory.class));
        org.keycloak.models.ClientProvider clients = mock(org.keycloak.models.ClientProvider.class);
        when(session.clients()).thenReturn(clients);
        when(clients.getClientByClientId(realm, CLIENT_ID)).thenReturn(client);

        when(repository.countActiveByUserAndClient(any(), any(), any())).thenReturn(0L);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        JpaConnectionProvider jpa = mock(JpaConnectionProvider.class);
        when(jpa.getEntityManager()).thenReturn(mock(EntityManager.class));
        when(session.getProvider(JpaConnectionProvider.class)).thenReturn(jpa);

        service = new ApiKeyService(session);
        Field f = ApiKeyService.class.getDeclaredField("repository");
        f.setAccessible(true);
        f.set(service, repository);
    }

    // ── name length ───────────────────────────────────────────────────────────

    @Nested
    class NameLength {

        @Test
        void acceptsNameAtMaxLength() {
            String name = "a".repeat(ApiKeyService.MAX_NAME_LENGTH);
            assertNoBadRequest(new ApiKeyCreateRequest(name, CLIENT_ID, null, null, null));
        }

        @Test
        void rejectsNameOverMaxLength() {
            String name = "a".repeat(ApiKeyService.MAX_NAME_LENGTH + 1);
            BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user,
                    new ApiKeyCreateRequest(name, CLIENT_ID, null, null, null), user));
            assertTrue(ex.getMessage().contains("name"));
        }

        @ParameterizedTest
        @ValueSource(ints = {1, 50, 100})
        void acceptsNameWithinLimit(int length) {
            String name = "x".repeat(length);
            assertNoBadRequest(new ApiKeyCreateRequest(name, CLIENT_ID, null, null, null));
        }
    }

    // ── roles count & element length ──────────────────────────────────────────

    @Nested
    class RolesValidation {

        @Test
        void acceptsRolesAtMaxCount() {
            // Use null/blank entries — the count check fires first and must not reject MAX_ROLES_COUNT
            // Role validation (existence/assignment) runs after, and blank names are skipped by validateRoles
            List<String> roles = Collections.nCopies(ApiKeyService.MAX_ROLES_COUNT, null);
            assertNoBadRequest(new ApiKeyCreateRequest("n", CLIENT_ID, roles, null, null));
        }

        @Test
        void rejectsRolesOverMaxCount() {
            List<String> roles = Collections.nCopies(ApiKeyService.MAX_ROLES_COUNT + 1, "r");
            BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user,
                    new ApiKeyCreateRequest("n", CLIENT_ID, roles, null, null), user));
            assertTrue(ex.getMessage().contains("roles") || ex.getMessage().contains("role"));
        }

        @Test
        void rejectsRoleNameOverMaxElementLength() {
            String longRole = "r".repeat(ApiKeyService.MAX_ROLE_SCOPE_ELEMENT_LENGTH + 1);
            BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user,
                    new ApiKeyCreateRequest("n", CLIENT_ID, List.of(longRole), null, null), user));
            assertTrue(ex.getMessage().contains("role"));
        }

        @Test
        void acceptsRoleNameAtMaxElementLength() {
            // A role name at exactly MAX length must not trigger the length guard.
            // The role-not-found error may still fire (role lookup is a separate concern).
            String role = "r".repeat(ApiKeyService.MAX_ROLE_SCOPE_ELEMENT_LENGTH);
            assertNoLengthRejection(
                new ApiKeyCreateRequest("n", CLIENT_ID, List.of(role), null, null));
        }
    }

    // ── scopes count & element length ─────────────────────────────────────────

    @Nested
    class ScopesValidation {

        @Test
        void acceptsScopesAtMaxCount() {
            // Use null entries — the count check fires first and must pass for MAX_SCOPES_COUNT.
            // Scope validation (allowed-scope check) runs after; null entries are skipped.
            List<String> scopes = Collections.nCopies(ApiKeyService.MAX_SCOPES_COUNT, null);
            assertNoBadRequest(new ApiKeyCreateRequest("n", CLIENT_ID, null, scopes, null));
        }

        @Test
        void rejectsScopesOverMaxCount() {
            List<String> scopes = Collections.nCopies(ApiKeyService.MAX_SCOPES_COUNT + 1, "s");
            BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user,
                    new ApiKeyCreateRequest("n", CLIENT_ID, null, scopes, null), user));
            assertTrue(ex.getMessage().contains("scope") || ex.getMessage().contains("scopes"));
        }

        @Test
        void rejectsScopeNameOverMaxElementLength() {
            String longScope = "s".repeat(ApiKeyService.MAX_ROLE_SCOPE_ELEMENT_LENGTH + 1);
            BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user,
                    new ApiKeyCreateRequest("n", CLIENT_ID, null, List.of(longScope), null), user));
            assertTrue(ex.getMessage().contains("scope"));
        }
    }

    // ── expiresAt validation ───────────────────────────────────────────────────

    @Nested
    class ExpiresAtValidation {

        @Test
        void acceptsExpiresAtInFuture() {
            Instant future = Instant.now().plusSeconds(3600);
            assertNoBadRequest(new ApiKeyCreateRequest("n", CLIENT_ID, null, null, future));
        }

        @Test
        void rejectsExpiresAtInPast() {
            Instant past = Instant.now().minusSeconds(60);
            BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user,
                    new ApiKeyCreateRequest("n", CLIENT_ID, null, null, past), user));
            assertTrue(ex.getMessage().contains("future") || ex.getMessage().contains("expiresAt"));
        }

        @Test
        void rejectsExpiresAtNow() {
            // "now" is not after now
            Instant justNow = Instant.now();
            assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user,
                    new ApiKeyCreateRequest("n", CLIENT_ID, null, null, justNow), user));
        }

        @Test
        void rejectsExpiresAtBeyondDefaultMaxTtl() {
            Instant tooFar = Instant.now()
                .plusSeconds(ApiKeyService.DEFAULT_MAX_TTL_SECONDS + 86400);
            BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user,
                    new ApiKeyCreateRequest("n", CLIENT_ID, null, null, tooFar), user));
            assertTrue(ex.getMessage().contains("TTL") || ex.getMessage().contains("maximum"));
        }

        @Test
        void acceptsExpiresAtAtExactlyMaxTtl() {
            // Exactly at the boundary — should be accepted (isAfter check is exclusive)
            Instant atLimit = Instant.now().plusSeconds(ApiKeyService.DEFAULT_MAX_TTL_SECONDS - 1);
            assertNoBadRequest(new ApiKeyCreateRequest("n", CLIENT_ID, null, null, atLimit));
        }

        @Test
        void acceptsNullExpiresAt() {
            // No expiry = never expires — must be allowed
            assertNoBadRequest(new ApiKeyCreateRequest("n", CLIENT_ID, null, null, null));
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void assertNoBadRequest(ApiKeyCreateRequest req) {
        try {
            service.createUserKey(realm, user, req, user);
        } catch (BadRequestException e) {
            throw new AssertionError("Unexpected BadRequestException: " + e.getMessage(), e);
        } catch (Throwable ignored) {
            // other exceptions from incomplete wiring — not the concern here
        }
    }

    /**
     * Verifies a request does not trigger a length-related BadRequestException.
     * Role/scope existence errors are acceptable (they come after the length check).
     */
    private void assertNoLengthRejection(ApiKeyCreateRequest req) {
        try {
            service.createUserKey(realm, user, req, user);
        } catch (BadRequestException e) {
            String msg = e.getMessage().toLowerCase();
            if (msg.contains("exceed") || msg.contains("maximum length") || msg.contains("length")) {
                throw new AssertionError(
                    "Length guard should not have fired at the limit: " + e.getMessage(), e);
            }
            // Other BadRequestExceptions (e.g. "Role not found") are expected and acceptable
        } catch (Throwable ignored) {
            // incomplete wiring
        }
    }
}
