package pl.emdzej.keycloak.apikeys;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.persistence.EntityManager;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.keycloak.connections.jpa.JpaConnectionProvider;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import pl.emdzej.keycloak.apikeys.dto.ApiKeyCreateRequest;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyRepository;

/**
 * Tests that ApiKeyService.validateRoles() stores roles as fully-qualified
 * identifiers (H5) to prevent name-collision across realm and client namespaces.
 */
class ApiKeyServiceRoleQualificationTest {

    private static final String REALM_ID  = "test-realm";
    private static final String USER_ID   = "user-1";
    private static final String CLIENT_ID = "my-app";

    private ApiKeyRepository repository;
    private ApiKeyService service;
    private RealmModel realm;
    private UserModel user;
    private ClientModel client;

    @BeforeEach
    void setUp() throws Exception {
        repository = mock(ApiKeyRepository.class);
        realm      = mock(RealmModel.class);
        user       = mock(UserModel.class);
        client     = mock(ClientModel.class);
        KeycloakSession session = mock(KeycloakSession.class);

        when(realm.getId()).thenReturn(REALM_ID);
        when(realm.getName()).thenReturn("test-realm-name");
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

        // quota: always under limit
        when(repository.countActiveByUserAndClient(any(), any(), any())).thenReturn(0L);

        when(repository.save(any())).thenAnswer(inv -> {
            ApiKeyEntity e = inv.getArgument(0);
            // Capture the entity passed to save() so createKey() can return it after
            // publishCreatedEvent fails due to incomplete session wiring.
            capturedSavedEntity = e;
            return e;
        });

        JpaConnectionProvider jpaProvider = mock(JpaConnectionProvider.class);
        when(jpaProvider.getEntityManager()).thenReturn(mock(EntityManager.class));
        when(session.getProvider(JpaConnectionProvider.class)).thenReturn(jpaProvider);

        service = new ApiKeyService(session);
        Field repoField = ApiKeyService.class.getDeclaredField("repository");
        repoField.setAccessible(true);
        repoField.set(service, repository);
    }

    // ── Client role stored as client:<id>:<role> ──────────────────────────────

    @Nested
    class ClientRoleQualification {

        @Test
        void storesClientRoleAsQualifiedIdentifier() throws Exception {
            RoleModel role = mock(RoleModel.class);
            when(client.getRole("read")).thenReturn(role);
            when(user.hasRole(role)).thenReturn(true);

            ApiKeyEntity saved = createKey(List.of("read"), null);

            assertTrue(saved.getRoles().contains("client:" + CLIENT_ID + ":read"),
                "Client role 'read' must be stored as 'client:my-app:read'");
        }

        @Test
        void storesMultipleClientRolesAsQualified() throws Exception {
            RoleModel read  = mock(RoleModel.class);
            RoleModel write = mock(RoleModel.class);
            when(client.getRole("read")).thenReturn(read);
            when(client.getRole("write")).thenReturn(write);
            when(user.hasRole(read)).thenReturn(true);
            when(user.hasRole(write)).thenReturn(true);

            ApiKeyEntity saved = createKey(List.of("read", "write"), null);

            assertTrue(saved.getRoles().contains("client:" + CLIENT_ID + ":read"));
            assertTrue(saved.getRoles().contains("client:" + CLIENT_ID + ":write"));
            assertEquals(2, saved.getRoles().size());
        }
    }

    // ── Realm role stored as realm:<role> ────────────────────────────────────

    @Nested
    class RealmRoleQualification {

        @Test
        void storesRealmRoleAsQualifiedIdentifier() throws Exception {
            when(client.getRole("admin")).thenReturn(null); // not a client role
            RoleModel role = mock(RoleModel.class);
            when(realm.getRole("admin")).thenReturn(role);
            when(user.hasRole(role)).thenReturn(true);

            ApiKeyEntity saved = createKey(List.of("admin"), null);

            assertTrue(saved.getRoles().contains("realm:admin"),
                "Realm role 'admin' must be stored as 'realm:admin'");
        }

        @Test
        void prefersClientRoleOverRealmRoleForSameName() throws Exception {
            // If the same name exists in both client and realm, client takes precedence
            RoleModel clientRole = mock(RoleModel.class);
            RoleModel realmRole  = mock(RoleModel.class);
            when(client.getRole("admin")).thenReturn(clientRole);
            when(realm.getRole("admin")).thenReturn(realmRole);
            when(user.hasRole(clientRole)).thenReturn(true);

            ApiKeyEntity saved = createKey(List.of("admin"), null);

            assertTrue(saved.getRoles().contains("client:" + CLIENT_ID + ":admin"),
                "Client role takes precedence over realm role of the same name");
            assertTrue(saved.getRoles().stream().noneMatch(r -> r.equals("realm:admin")),
                "Realm role must not be stored when client role matched first");
        }
    }

    // ── No plain role names stored after H5 ───────────────────────────────────

    @Nested
    class NoPlainRoleNames {

        @Test
        void noUnqualifiedRoleNameStoredForClientRole() throws Exception {
            RoleModel role = mock(RoleModel.class);
            when(client.getRole("read")).thenReturn(role);
            when(user.hasRole(role)).thenReturn(true);

            ApiKeyEntity saved = createKey(List.of("read"), null);

            assertTrue(saved.getRoles().stream().noneMatch(r -> r.equals("read")),
                "Plain unqualified 'read' must not be stored — only 'client:my-app:read'");
        }

        @Test
        void noUnqualifiedRoleNameStoredForRealmRole() throws Exception {
            when(client.getRole("superuser")).thenReturn(null);
            RoleModel role = mock(RoleModel.class);
            when(realm.getRole("superuser")).thenReturn(role);
            when(user.hasRole(role)).thenReturn(true);

            ApiKeyEntity saved = createKey(List.of("superuser"), null);

            assertTrue(saved.getRoles().stream().noneMatch(r -> r.equals("superuser")),
                "Plain unqualified 'superuser' must not be stored — only 'realm:superuser'");
        }
    }

    // ── Error cases ───────────────────────────────────────────────────────────

    @Nested
    class ErrorCases {

        @Test
        void rejectsRoleNotFoundInClientOrRealm() {
            when(client.getRole("ghost")).thenReturn(null);
            when(realm.getRole("ghost")).thenReturn(null);

            assertThrows(BadRequestException.class,
                () -> createKey(List.of("ghost"), null));
        }

        @Test
        void rejectsClientRoleNotAssignedToUser() {
            RoleModel role = mock(RoleModel.class);
            when(client.getRole("admin")).thenReturn(role);
            when(user.hasRole(role)).thenReturn(false);

            assertThrows(ForbiddenException.class,
                () -> createKey(List.of("admin"), null));
        }

        @Test
        void rejectsRealmRoleNotAssignedToUser() {
            when(client.getRole("superuser")).thenReturn(null);
            RoleModel role = mock(RoleModel.class);
            when(realm.getRole("superuser")).thenReturn(role);
            when(user.hasRole(role)).thenReturn(false);

            assertThrows(ForbiddenException.class,
                () -> createKey(List.of("superuser"), null));
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /**
     * Calls createUserKey and returns the entity saved by the mock repository.
     * Re-throws validation exceptions (BadRequest/Forbidden) so error-case tests work.
     * Swallows other exceptions (publishCreatedEvent NPE from incomplete session wiring)
     * and returns the entity that was passed to repository.save() — which is what we inspect.
     */
    private ApiKeyEntity createKey(List<String> roles, List<String> scopes) throws Exception {
        ApiKeyCreateRequest req = new ApiKeyCreateRequest("Name", CLIENT_ID, roles, scopes, null);
        try {
            return service.createUserKey(realm, user, req, user).entity();
        } catch (BadRequestException | ForbiddenException e) {
            throw e;
        } catch (Throwable ignored) {
            // publishCreatedEvent / event publishing fails without full session wiring.
            // repository.save() already ran and captured roles into the captor entity.
        }
        // Return the last entity passed to repository.save()
        return capturedSavedEntity;
    }

    /** Captures the entity from the repository.save() mock answer so createKey can return it. */
    private ApiKeyEntity capturedSavedEntity;
}
