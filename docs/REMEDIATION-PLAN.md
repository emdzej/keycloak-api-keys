# Security Remediation Plan — Keycloak API Keys SPI

**Source**: `docs/SECURITY-AUDIT.md`
**Created**: 2026-03-19
**Status**: In progress

---

## Sprint 1 — Critical Path

| # | ID | Status | Effort |
|---|-----|--------|--------|
| 1 | H2 | pending | Small |
| 2 | H3 | pending | Small |
| 3 | H6-a | pending | Small |
| 4 | L1 | pending | Small |
| 5 | L2 | pending | Trivial |

### H2 — Remove cookie-auth fallback from POST/DELETE

**File**: `rest/AccountApiKeyResource.java:69-79`

Split `authenticate()` into two methods:
- `authenticateBearer()` — bearer token only; used by `POST` (create) and `DELETE` (revoke)
- `authenticate()` — bearer + cookie fallback; used by `GET` only

This eliminates the CSRF attack surface on state-changing endpoints. Cookie auth is
acceptable on `GET` because listing keys is a safe, read-only operation.

```java
// Bearer-only (POST / DELETE)
private AuthResult authenticateBearer() {
    AuthResult auth = new AppAuthManager.BearerTokenAuthenticator(session).authenticate();
    if (auth == null) {
        throw new NotAuthorizedException("Bearer");
    }
    logger.debugf("Bearer auth: success (user=%s)", auth.getUser().getId());
    return auth;
}

// Bearer + cookie fallback (GET)
private AuthResult authenticate() {
    AuthResult auth = new AppAuthManager.BearerTokenAuthenticator(session).authenticate();
    if (auth != null) {
        logger.debugf("Bearer auth: success (user=%s)", auth.getUser().getId());
        return auth;
    }
    auth = new AppAuthManager().authenticateIdentityCookie(session, session.getContext().getRealm());
    if (auth != null) {
        logger.debugf("Cookie auth: success (user=%s)", auth.getUser().getId());
        return auth;
    }
    logger.warn("Both bearer and cookie auth failed for api-keys request");
    throw new NotAuthorizedException("Bearer");
}
```

---

### H3 — Fix rate limiter counter reset on config update

**File**: `ratelimit/InMemoryRateLimiter.java:89-97`

`Entry.updateConfig()` currently recreates all 4 token buckets unconditionally, resetting
them to full capacity. This means every token exchange call (which calls `updateConfig`)
silently resets the rate limit counters.

Fix: compare `newConfig` with `this.config` using `equals()` first. Only recreate buckets
when the config actually changes. `RateLimitConfig` must implement `equals()` / `hashCode()`.

```java
private synchronized void updateConfig(RateLimitConfig newConfig) {
    if (newConfig.equals(this.config)) {
        return; // config unchanged — preserve existing bucket state
    }
    this.config = newConfig;
    long nowNanos = System.nanoTime();
    this.minuteBucket = new Bucket(newConfig.perMinute(), 60.0, nowNanos);
    this.hourBucket   = new Bucket(newConfig.perHour(),   3600.0, nowNanos);
    this.dayBucket    = new Bucket(newConfig.perDay(),    86_400.0, nowNanos);
    this.burstBucket  = new Bucket(newConfig.burst(),     60.0, nowNanos);
    this.lastAccessEpochSeconds = Instant.now().getEpochSecond();
}
```

Also add `equals()` / `hashCode()` to `RateLimitConfig` (currently a plain record — records
already implement this, so no extra work needed if it is a Java record).

---

### H6-a — Per-user key quota

**Files**: `ApiKeyService.java:53-73`, `jpa/JpaApiKeyRepository.java`, `jpa/ApiKeyRepository.java`

Add a JPQL `COUNT` query to the repository:

```java
// ApiKeyRepository.java
long countActiveByUserAndClient(String realmId, String userId, String clientId);

// JpaApiKeyRepository.java
@Override
public long countActiveByUserAndClient(String realmId, String userId, String clientId) {
    return em.createQuery(
            "select count(k) from ApiKeyEntity k " +
            "where k.realmId = :realmId and k.userId = :userId " +
            "and k.clientId = :clientId and k.revokedAt is null",
            Long.class)
        .setParameter("realmId", realmId)
        .setParameter("userId", userId)
        .setParameter("clientId", clientId)
        .getSingleResult();
}
```

Check quota in `ApiKeyService.createUserKey()` before creating:

```java
private static final int MAX_ACTIVE_KEYS_PER_USER_PER_CLIENT = 25;

// inside createUserKey(), after client validation:
long activeKeyCount = repository.countActiveByUserAndClient(
    realm.getId(), user.getId(), client.getClientId());
if (activeKeyCount >= MAX_ACTIVE_KEYS_PER_USER_PER_CLIENT) {
    throw new BadRequestException(
        "Key quota exceeded: maximum " + MAX_ACTIVE_KEYS_PER_USER_PER_CLIENT +
        " active keys per user per client");
}
```

---

### L1 — Normalize grant-type error responses

**File**: `protocol/ApiKeyGrantType.java:59-108`

Replace all 5 distinguishable error strings with a single generic message externally.
Keep specific reason in `event.detail()` for server-side audit logs only.

Before:
```java
throw invalidGrant("API key revoked");
throw invalidGrant("API key expired");
throw invalidClient("Client ID does not match API key");
throw invalidGrant("User disabled");
```

After:
```java
// Server-side detail only:
event.detail(Details.REASON, "api_key_revoked");
throw invalidGrant("Invalid API key or unauthorized");

event.detail(Details.REASON, "api_key_expired");
throw invalidGrant("Invalid API key or unauthorized");

event.detail(Details.REASON, "client_id_mismatch");
throw invalidClient("Invalid API key or unauthorized");

event.detail(Details.REASON, "user_disabled");
throw invalidGrant("Invalid API key or unauthorized");
```

---

### L2 — Fix verbose debug logging

**File**: `rest/AccountApiKeyResource.java:71-77`

Before:
```java
logger.debugf("Bearer auth result: %s", auth);
logger.debugf("Cookie auth result: %s", auth);
```

After (folded into the refactored `authenticate()` / `authenticateBearer()` from H2 above):
```java
logger.debugf("Bearer auth: %s",
    auth != null ? "success (user=" + auth.getUser().getId() + ")" : "failed");
```

---

## Sprint 2 — Hardening

| # | ID | Status | Effort |
|---|-----|--------|--------|
| 6 | H1 | pending | Medium |
| 7 | H5 | pending | Medium |
| 8 | M1 | pending | Small |
| 9 | M2 | pending | Medium |
| 10 | H6-b | pending | Medium |

### H1 — Audience check on user endpoints

**File**: `rest/AccountApiKeyResource.java`

After bearer auth succeeds, verify the token audience includes `account`.

```java
private AuthResult authenticateBearer() {
    AuthResult auth = new AppAuthManager.BearerTokenAuthenticator(session).authenticate();
    if (auth == null) {
        throw new NotAuthorizedException("Bearer");
    }
    if (!auth.getToken().hasAudience("account")) {
        throw new ForbiddenException("Missing required audience: account");
    }
    logger.debugf("Bearer auth: success (user=%s)", auth.getUser().getId());
    return auth;
}
```

Same check in the bearer branch of `authenticate()` (GET path).

**Note**: Callers must request an access token with `audience=account` (or configure the
client to include `account` in the token audience via Keycloak's audience mapper).

---

### H5 — Qualified role identifiers

**Files**: `ApiKeyService.java:247-273`, `protocol/ApiKeyTokenHelper.java:58-89`

Store and filter roles as fully-qualified strings to avoid name collision across namespaces.

Format:
- Realm roles: `realm:<roleName>` — e.g. `realm:admin`
- Client roles: `client:<clientId>:<roleName>` — e.g. `client:orders-api:read`

**`ApiKeyService.validateRoles()`** — produce qualified names when storing:
```java
for (String roleName : roles) {
    RoleModel role = client.getRole(roleName);
    if (role != null) {
        validated.add("client:" + client.getClientId() + ":" + roleName);
        continue;
    }
    role = realm.getRole(roleName);
    if (role != null) {
        validated.add("realm:" + roleName);
        continue;
    }
    throw new BadRequestException("Role not found: " + roleName);
}
```

**`ApiKeyTokenHelper.restrictRoles()`** — filter per namespace:
```java
Set<String> realmGranted = apiKey.getRoles().stream()
    .filter(r -> r.startsWith("realm:"))
    .map(r -> r.substring("realm:".length()))
    .collect(Collectors.toSet());

Map<String, Set<String>> clientGranted = new HashMap<>();
for (String r : apiKey.getRoles()) {
    if (r.startsWith("client:")) {
        String[] parts = r.split(":", 3);
        if (parts.length == 3) {
            clientGranted.computeIfAbsent(parts[1], k -> new HashSet<>()).add(parts[2]);
        }
    }
}
// then filter realmAccess with realmGranted and resourceAccess per clientId with clientGranted
```

**Migration**: Existing stored roles are plain strings. A Liquibase migration script will
need to rewrite `api_key_roles.roles` values, or the service must handle both formats
during a transition window.

---

### M1 — Input size and lifetime validation

**Files**: `ApiKeyService.java:53-73`, `dto/ApiKeyCreateRequest.java`

Add explicit checks in `ApiKeyService.createUserKey()`:

```java
private static final int MAX_NAME_LENGTH = 100;
private static final int MAX_ROLE_SCOPE_LENGTH = 100;
private static final int MAX_ROLES_COUNT = 20;
private static final int MAX_SCOPES_COUNT = 20;
// Max TTL configurable via realm attribute; default 1 year
private static final long DEFAULT_MAX_TTL_SECONDS = 365L * 24 * 60 * 60;

// Validate name length
if (request.getName().length() > MAX_NAME_LENGTH) {
    throw new BadRequestException("name must be at most " + MAX_NAME_LENGTH + " characters");
}
// Validate roles/scopes count and element length
if (request.getRoles() != null && request.getRoles().size() > MAX_ROLES_COUNT) {
    throw new BadRequestException("A key may have at most " + MAX_ROLES_COUNT + " roles");
}
if (request.getScopes() != null && request.getScopes().size() > MAX_SCOPES_COUNT) {
    throw new BadRequestException("A key may have at most " + MAX_SCOPES_COUNT + " scopes");
}
// Validate expiresAt is in the future
if (request.getExpiresAt() != null) {
    Instant now = Instant.now();
    if (!request.getExpiresAt().isAfter(now)) {
        throw new BadRequestException("expiresAt must be in the future");
    }
    long maxTtl = resolveMaxTtlSeconds(realm);
    if (request.getExpiresAt().isAfter(now.plusSeconds(maxTtl))) {
        throw new BadRequestException("expiresAt exceeds the maximum allowed TTL");
    }
}
```

---

### M2 — Optimistic locking to close TOCTOU race on revocation

**Files**: `jpa/ApiKeyEntity.java`, `protocol/ApiKeyGrantType.java:74-89, 171-220`

Add a `@Version` field to `ApiKeyEntity`:
```java
@Version
@Column(name = "version", nullable = false)
private long version;
```

Requires a Liquibase changelog entry:
```xml
<addColumn tableName="api_key">
    <column name="version" type="BIGINT" defaultValueNumeric="0">
        <constraints nullable="false"/>
    </column>
</addColumn>
```

In `ApiKeyGrantType`, re-check revocation immediately before the final token save:
```java
// After building the token but before returning:
ApiKeyEntity fresh = apiKeyService.findById(realm, apiKey.getId());
if (fresh == null || fresh.getRevokedAt() != null) {
    throw invalidGrant("Invalid API key or unauthorized");
}
```

Wrap the final save in a try/catch for `OptimisticLockException`:
```java
try {
    apiKeyService.save(apiKey);
} catch (OptimisticLockException e) {
    throw invalidGrant("Invalid API key or unauthorized");
}
```

---

### H6-b — Pagination and JPQL filtering

**Files**: `jpa/JpaApiKeyRepository.java`, `jpa/ApiKeyRepository.java`, `ApiKeyService.java`,
`rest/AdminApiKeyResource.java`, `rest/AccountApiKeyResource.java`

Add paginated, server-side filtered queries to the repository:

```java
// ApiKeyRepository.java
List<ApiKeyEntity> findByRealm(String realmId, String userId, String clientId,
                               Boolean active, int first, int max);
long countByRealm(String realmId, String userId, String clientId, Boolean active);

// JpaApiKeyRepository.java — build dynamic JPQL WHERE clause
```

Update `AdminApiKeyResource.list()` to accept `?first=0&max=25`:
```java
public List<AdminApiKeyResponse> list(@QueryParam("userId") String userId,
                                      @QueryParam("clientId") String clientId,
                                      @QueryParam("status") String status,
                                      @QueryParam("first") @DefaultValue("0") int first,
                                      @QueryParam("max") @DefaultValue("25") int max)
```

Replace `ApiKeyService.countAll()` with a JPQL `COUNT` query instead of loading all rows.

---

## Sprint 3 — Defense in Depth

| # | ID | Status | Effort |
|---|-----|--------|--------|
| 11 | H4 | pending | Medium |
| 12 | M3 | pending | Small |
| 13 | L3 | pending | Medium |

### H4 — Fail-closed rate limiter in production

**File**: `ratelimit/DefaultRateLimiterProvider.java:36-47`

Add a configurable fail-closed mode via realm attribute `apiKeysRateLimitFailClosed` (boolean).

```java
private RateLimiter createRateLimiter() {
    try {
        InfinispanConnectionProvider provider = session.getProvider(InfinispanConnectionProvider.class);
        if (provider == null) {
            return handleInfinispanUnavailable();
        }
        return new InfinispanRateLimiter(session);
    } catch (Exception ex) {
        LOGGER.warn("Failed to initialize Infinispan rate limiter.", ex);
        return handleInfinispanUnavailable();
    }
}

private RateLimiter handleInfinispanUnavailable() {
    boolean failClosed = isFailClosedEnabled();
    if (failClosed) {
        LOGGER.error("Infinispan unavailable and fail-closed mode is enabled. " +
                     "All API key exchanges will be rejected with 503.");
        return new FailClosedRateLimiter();
    }
    LOGGER.warn("Infinispan unavailable; falling back to in-memory rate limiter (per-node only).");
    return new InMemoryRateLimiter();
}
```

`FailClosedRateLimiter` always returns `false` from `tryAcquire()` and `isHealthy()`.
`ApiKeyGrantType` should map `isHealthy() == false` to a `503 Service Unavailable` response.

---

### M3 — Clean up auth sessions after token issuance

**File**: `protocol/ApiKeyGrantType.java:157-185`

After `responseBuilder.build()`, explicitly remove the root auth session:

```java
AccessTokenResponse res = responseBuilder.build();
// Clean up the auth session to prevent accumulation
try {
    session.authenticationSessions()
           .removeRootAuthenticationSession(realm, rootAuthSession);
} catch (Exception ex) {
    logger.warnf(ex, "Failed to remove auth session %s",
                 rootAuthSession.getId());
}
```

---

### L3 — HMAC-SHA-256 with server pepper

**File**: `ApiKeyHasher.java:14-25`

Switch from plain `SHA-256` to `HMAC-SHA-256` with a server-side pepper:

```java
public static String hash(String key, byte[] pepper) {
    try {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(pepper, "HmacSHA256"));
        byte[] bytes = mac.doFinal(key.getBytes(StandardCharsets.UTF_8));
        // hex encode bytes...
    } catch (Exception e) {
        throw new IllegalStateException("Unable to hash api key", e);
    }
}
```

Pepper sourced from (in priority order):
1. Keycloak Vault: `session.vault().getStringSecret("api-key-pepper")`
2. Environment variable: `API_KEY_PEPPER`
3. Reject startup if neither is set in production

**Migration strategy** (dual-hash transition):
1. Deploy with HMAC but keep the old plain-SHA-256 `hash()` method
2. On lookup: try HMAC hash first; if no match, try plain SHA-256 (and re-hash+save on match)
3. After all keys have been rotated, remove the plain SHA-256 fallback

---

## Implementation Notes

- **H5** (qualified roles) is a **breaking change** to the stored data format. Needs a
  Liquibase data migration to rewrite `api_key_roles.roles` values before deployment.
- **M2** (optimistic locking) requires a Liquibase schema migration to add a `version`
  column to `api_key`.
- **L3** (HMAC pepper) requires a dual-hash lookup transition period until all existing
  plain-SHA-256 keys are rotated out naturally.
- **H6-a** (quota) should be implemented before **H6-b** (pagination) since quota is a
  quick guard while pagination is a larger refactor.
