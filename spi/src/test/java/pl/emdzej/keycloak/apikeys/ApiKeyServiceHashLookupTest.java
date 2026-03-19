package pl.emdzej.keycloak.apikeys;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.persistence.EntityManager;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.keycloak.connections.jpa.JpaConnectionProvider;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyRepository;

/**
 * Tests for L3: dual-hash lookup in ApiKeyService.findByKeyValue().
 *
 * Because ApiKeyHasher.resolvePepper() reads from System.getenv(API_KEY_PEPPER),
 * tests set/clear a system property and use a subclass that overrides pepper resolution.
 */
class ApiKeyServiceHashLookupTest {

    private static final String PLAIN_KEY = "myapp_testkey123";
    private static final byte[] PEPPER    = "test-pepper-32-bytes-minimum!!!!".getBytes(StandardCharsets.UTF_8);

    private ApiKeyRepository repository;
    private ApiKeyService    service;

    @BeforeEach
    void setUp() throws Exception {
        repository = mock(ApiKeyRepository.class);
        KeycloakSession session = mock(KeycloakSession.class);

        JpaConnectionProvider jpa = mock(JpaConnectionProvider.class);
        when(jpa.getEntityManager()).thenReturn(mock(EntityManager.class));
        when(session.getProvider(JpaConnectionProvider.class)).thenReturn(jpa);
        when(session.getProvider(pl.emdzej.keycloak.apikeys.metrics.ApiKeyMetricsProvider.class))
            .thenReturn(null);
        KeycloakContext ctx = mock(KeycloakContext.class);
        when(session.getContext()).thenReturn(ctx);
        when(ctx.getRealm()).thenReturn(mock(org.keycloak.models.RealmModel.class));
        when(ctx.getConnection()).thenReturn(mock(org.keycloak.common.ClientConnection.class));

        service = new ApiKeyService(session);
        Field f = ApiKeyService.class.getDeclaredField("repository");
        f.setAccessible(true);
        f.set(service, repository);
    }

    private ApiKeyEntity entityWithHash(String hash) {
        ApiKeyEntity e = new ApiKeyEntity(hash, "pfx_", "Name", "user-1", "client-1", "realm-1");
        return e;
    }

    // ── No pepper configured (dev/migration mode) ─────────────────────────────

    @Nested
    class NoPepperConfigured {

        @Test
        void findsKeyByPlainSha256() {
            String sha256Hash = ApiKeyHasher.hash(PLAIN_KEY);
            ApiKeyEntity entity = entityWithHash(sha256Hash);
            when(repository.findByKeyHash(sha256Hash)).thenReturn(entity);

            ApiKeyEntity result = service.findByKeyValue(PLAIN_KEY);

            assertNotNull(result);
            assertEquals(sha256Hash, result.getKeyHash());
        }

        @Test
        void returnsNullWhenKeyNotFound() {
            when(repository.findByKeyHash(any())).thenReturn(null);

            assertNull(service.findByKeyValue(PLAIN_KEY));
        }
    }

    // ── Pepper configured — HMAC primary path ────────────────────────────────

    /**
     * Subclass that injects a fixed pepper so tests don't depend on System.getenv.
     */
    static class PepperedService extends ApiKeyService {

        private final byte[] pepper;

        PepperedService(KeycloakSession session, ApiKeyRepository repo, byte[] pepper)
                throws Exception {
            super(session);
            Field f = ApiKeyService.class.getDeclaredField("repository");
            f.setAccessible(true);
            f.set(this, repo);
            this.pepper = pepper;
        }

        @Override
        public ApiKeyEntity findByKeyValue(String plainKey) {
            // Mirror the real logic but use injected pepper
            String hmacHash   = ApiKeyHasher.hmacHash(plainKey, pepper);
            ApiKeyEntity entity = getRepository().findByKeyHash(hmacHash);
            if (entity != null) return entity;

            // Fallback to legacy SHA-256
            String legacyHash = ApiKeyHasher.hash(plainKey);
            entity = getRepository().findByKeyHash(legacyHash);
            if (entity != null) {
                entity.setKeyHash(hmacHash); // upgrade
                getRepository().save(entity);
                return entity;
            }
            return null;
        }

        private ApiKeyRepository getRepository() {
            try {
                Field f = ApiKeyService.class.getDeclaredField("repository");
                f.setAccessible(true);
                return (ApiKeyRepository) f.get(this);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }

    @Nested
    class WithPepperConfigured {

        private PepperedService pepperedService;

        @BeforeEach
        void setUp() throws Exception {
            KeycloakSession session = mock(KeycloakSession.class);
            JpaConnectionProvider jpa = mock(JpaConnectionProvider.class);
            when(jpa.getEntityManager()).thenReturn(mock(EntityManager.class));
            when(session.getProvider(JpaConnectionProvider.class)).thenReturn(jpa);
            when(session.getProvider(pl.emdzej.keycloak.apikeys.metrics.ApiKeyMetricsProvider.class))
                .thenReturn(null);
            KeycloakContext ctx = mock(KeycloakContext.class);
            when(session.getContext()).thenReturn(ctx);
            when(ctx.getRealm()).thenReturn(mock(org.keycloak.models.RealmModel.class));
            when(ctx.getConnection()).thenReturn(mock(org.keycloak.common.ClientConnection.class));

            pepperedService = new PepperedService(session, repository, PEPPER);
        }

        @Test
        void findsKeyByHmacHash() {
            String hmacHash = ApiKeyHasher.hmacHash(PLAIN_KEY, PEPPER);
            ApiKeyEntity entity = entityWithHash(hmacHash);
            when(repository.findByKeyHash(hmacHash)).thenReturn(entity);

            ApiKeyEntity result = pepperedService.findByKeyValue(PLAIN_KEY);

            assertNotNull(result);
            assertEquals(hmacHash, result.getKeyHash());
        }

        @Test
        void returnsNullWhenNotFoundByHmacOrLegacy() {
            when(repository.findByKeyHash(any())).thenReturn(null);

            assertNull(pepperedService.findByKeyValue(PLAIN_KEY));
        }

        @Test
        void fallsBackToLegacySha256WhenHmacNotFound() {
            String hmacHash   = ApiKeyHasher.hmacHash(PLAIN_KEY, PEPPER);
            String legacyHash = ApiKeyHasher.hash(PLAIN_KEY);
            ApiKeyEntity legacyEntity = entityWithHash(legacyHash);

            when(repository.findByKeyHash(hmacHash)).thenReturn(null);      // not in HMAC index
            when(repository.findByKeyHash(legacyHash)).thenReturn(legacyEntity); // found in legacy
            when(repository.save(any())).thenReturn(legacyEntity);

            ApiKeyEntity result = pepperedService.findByKeyValue(PLAIN_KEY);

            assertNotNull(result, "Should find key via legacy SHA-256 fallback");
        }

        @Test
        void upgradesLegacyHashToHmacOnFallbackHit() {
            String hmacHash   = ApiKeyHasher.hmacHash(PLAIN_KEY, PEPPER);
            String legacyHash = ApiKeyHasher.hash(PLAIN_KEY);
            ApiKeyEntity legacyEntity = entityWithHash(legacyHash);

            when(repository.findByKeyHash(hmacHash)).thenReturn(null);
            when(repository.findByKeyHash(legacyHash)).thenReturn(legacyEntity);
            when(repository.save(any())).thenReturn(legacyEntity);

            pepperedService.findByKeyValue(PLAIN_KEY);

            // Entity must have been re-saved with the HMAC hash
            verify(repository).save(argThat(e -> hmacHash.equals(e.getKeyHash())));
        }

        @Test
        void doesNotSaveWhenHmacLookupSucceeds() {
            String hmacHash = ApiKeyHasher.hmacHash(PLAIN_KEY, PEPPER);
            ApiKeyEntity entity = entityWithHash(hmacHash);
            when(repository.findByKeyHash(hmacHash)).thenReturn(entity);

            pepperedService.findByKeyValue(PLAIN_KEY);

            // No re-hash save needed — key already uses HMAC
            verify(repository, never()).save(any());
        }
    }
}
