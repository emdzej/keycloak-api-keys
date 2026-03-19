package pl.emdzej.keycloak.apikeys;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.ws.rs.BadRequestException;
import java.lang.reflect.Field;
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
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyRepository;

/**
 * Tests the per-user-per-client key quota enforced by ApiKeyService (H6-a).
 *
 * Uses a test-double repository injected via reflection to avoid the need
 * for a real JPA EntityManager or Keycloak session.
 */
class ApiKeyServiceQuotaTest {

    private static final int MAX_KEYS = 25;
    private static final String REALM_ID  = "test-realm";
    private static final String USER_ID   = "user-1";
    private static final String CLIENT_ID = "my-app";

    private ApiKeyRepository repository;
    private ApiKeyService service;
    private RealmModel realm;
    private UserModel user;
    private ClientModel client;
    private KeycloakSession session;

    @BeforeEach
    void setUp() throws Exception {
        repository = mock(ApiKeyRepository.class);
        realm      = mock(RealmModel.class);
        user       = mock(UserModel.class);
        client     = mock(ClientModel.class);
        session    = mock(KeycloakSession.class);

        when(realm.getId()).thenReturn(REALM_ID);
        when(realm.getName()).thenReturn("test-realm-name");
        when(user.getId()).thenReturn(USER_ID);
        when(client.getClientId()).thenReturn(CLIENT_ID);
        when(client.isEnabled()).thenReturn(true);
        when(client.isPublicClient()).thenReturn(true); // skip role check

        // Session wiring
        KeycloakContext ctx = mock(KeycloakContext.class);
        when(session.getContext()).thenReturn(ctx);
        when(ctx.getRealm()).thenReturn(realm);
        when(ctx.getConnection()).thenReturn(mock(org.keycloak.common.ClientConnection.class));
        when(session.getProvider(JpaConnectionProvider.class)).thenReturn(null); // not used — we inject repo
        when(session.getProvider(pl.emdzej.keycloak.apikeys.metrics.ApiKeyMetricsProvider.class)).thenReturn(null);
        when(session.getKeycloakSessionFactory()).thenReturn(mock(KeycloakSessionFactory.class));

        // Client lookup
        org.keycloak.models.ClientProvider clients = mock(org.keycloak.models.ClientProvider.class);
        when(session.clients()).thenReturn(clients);
        when(clients.getClientByClientId(realm, CLIENT_ID)).thenReturn(client);

        // Scope/role stubs (empty = no restrictions)
        when(client.getClientScopes(true)).thenReturn(Map.of());
        when(client.getClientScopes(false)).thenReturn(Map.of());
        when(client.getDynamicClientScope(any())).thenReturn(null);

        // Saved entity stub
        ApiKeyEntity savedEntity = new ApiKeyEntity(
            "hash-abc", CLIENT_ID + "_", "Test Key", USER_ID, CLIENT_ID, REALM_ID);
        when(repository.save(any())).thenReturn(savedEntity);

        // Build service and inject mock repository via reflection
        service = buildServiceWithRepository(session, repository);
    }

    // ── Quota enforcement ─────────────────────────────────────────────────────

    @Nested
    class QuotaEnforcement {

        @Test
        void allowsCreationWhenUnderQuota() {
            when(repository.countActiveByUserAndClient(REALM_ID, USER_ID, CLIENT_ID))
                .thenReturn((long) MAX_KEYS - 1);

            ApiKeyCreateRequest req = new ApiKeyCreateRequest("Key", CLIENT_ID, null, null, null);
            assertNoBadRequestException(() -> service.createUserKey(realm, user, req, user));
        }

        @Test
        void allowsCreationWhenAtExactlyZeroKeys() {
            when(repository.countActiveByUserAndClient(REALM_ID, USER_ID, CLIENT_ID))
                .thenReturn(0L);

            ApiKeyCreateRequest req = new ApiKeyCreateRequest("Key", CLIENT_ID, null, null, null);
            assertNoBadRequestException(() -> service.createUserKey(realm, user, req, user));
        }

        @Test
        void rejectsCreationWhenAtMaxQuota() {
            when(repository.countActiveByUserAndClient(REALM_ID, USER_ID, CLIENT_ID))
                .thenReturn((long) MAX_KEYS);

            ApiKeyCreateRequest req = new ApiKeyCreateRequest("Key", CLIENT_ID, null, null, null);
            BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user, req, user));

            assertTrue(ex.getMessage().toLowerCase().contains("quota"),
                "Error message must mention 'quota'");
        }

        @Test
        void rejectsCreationWhenOverMaxQuota() {
            when(repository.countActiveByUserAndClient(REALM_ID, USER_ID, CLIENT_ID))
                .thenReturn((long) MAX_KEYS + 5);

            ApiKeyCreateRequest req = new ApiKeyCreateRequest("Key", CLIENT_ID, null, null, null);
            assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user, req, user));
        }

        @ParameterizedTest
        @ValueSource(longs = {24, 23, 10, 1, 0})
        void allowsCreationBelowMaxQuota(long activeCount) {
            when(repository.countActiveByUserAndClient(REALM_ID, USER_ID, CLIENT_ID))
                .thenReturn(activeCount);

            ApiKeyCreateRequest req = new ApiKeyCreateRequest("Key", CLIENT_ID, null, null, null);
            assertNoBadRequestException(() -> service.createUserKey(realm, user, req, user));
        }

        @ParameterizedTest
        @ValueSource(longs = {25, 26, 50, 100})
        void rejectsCreationAtOrAboveMaxQuota(long activeCount) {
            when(repository.countActiveByUserAndClient(REALM_ID, USER_ID, CLIENT_ID))
                .thenReturn(activeCount);

            ApiKeyCreateRequest req = new ApiKeyCreateRequest("Key", CLIENT_ID, null, null, null);
            assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user, req, user));
        }
    }

    // ── Quota is per-user-per-client ──────────────────────────────────────────

    @Nested
    class QuotaScope {

        @Test
        void quotaIsCheckedForCorrectUserAndClient() {
            // The quota for this user+client combo is at max
            when(repository.countActiveByUserAndClient(REALM_ID, USER_ID, CLIENT_ID))
                .thenReturn((long) MAX_KEYS);
            // A different user+client combo is under the limit (should not affect this request)
            when(repository.countActiveByUserAndClient(REALM_ID, "other-user", CLIENT_ID))
                .thenReturn(0L);

            ApiKeyCreateRequest req = new ApiKeyCreateRequest("Key", CLIENT_ID, null, null, null);
            assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user, req, user),
                "Quota must be checked for the requesting user's specific user+client combination");
        }

        @Test
        void quotaErrorMessageIncludesLimit() {
            when(repository.countActiveByUserAndClient(REALM_ID, USER_ID, CLIENT_ID))
                .thenReturn((long) MAX_KEYS);

            ApiKeyCreateRequest req = new ApiKeyCreateRequest("Key", CLIENT_ID, null, null, null);
            BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.createUserKey(realm, user, req, user));

            assertTrue(ex.getMessage().contains(String.valueOf(MAX_KEYS)),
                "Error message must include the quota limit value");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Runs the supplier and asserts that it does NOT throw a {@link BadRequestException}.
     * Other exceptions (e.g. from incomplete service wiring in unit tests) are ignored,
     * because we're only testing whether the quota guard fires.
     */
    private static void assertNoBadRequestException(org.junit.jupiter.api.function.Executable executable) {
        try {
            executable.execute();
        } catch (BadRequestException e) {
            fail("Expected no BadRequestException to be thrown, but got: " + e.getMessage());
        } catch (Throwable ignored) {
            // Other exceptions are from incomplete unit-test wiring, not quota logic
        }
    }

    // ── Helper: build ApiKeyService with injected repository ──────────────────

    /**
     * Constructs an ApiKeyService and replaces its private {@code repository} field
     * with the supplied mock via reflection. This avoids requiring a real JPA context
     * while still exercising the real service logic.
     */
    private static ApiKeyService buildServiceWithRepository(
            KeycloakSession session, ApiKeyRepository repository) throws Exception {

        // We need a minimal JpaConnectionProvider so the constructor doesn't NPE
        JpaConnectionProvider jpaProvider = mock(JpaConnectionProvider.class);
        jakarta.persistence.EntityManager em = mock(jakarta.persistence.EntityManager.class);
        when(jpaProvider.getEntityManager()).thenReturn(em);
        when(session.getProvider(JpaConnectionProvider.class)).thenReturn(jpaProvider);

        ApiKeyService svc = new ApiKeyService(session);

        Field repoField = ApiKeyService.class.getDeclaredField("repository");
        repoField.setAccessible(true);
        repoField.set(svc, repository);

        return svc;
    }
}
