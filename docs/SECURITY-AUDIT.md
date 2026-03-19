# Security Audit — Keycloak API Keys SPI

**Date**: 2026-03-18
**Scope**: `spi/src/main/java/pl/emdzej/keycloak/apikeys/` — all Java source, Liquibase changelog, META-INF resources
**Status**: Initial audit — findings documented, remediation pending

---

## Executive Summary

No critical vulnerabilities (SQL injection, authentication bypass, key hash exposure) were found. The most serious risks are around **authorization on self-service endpoints**, **rate-limit failure behaviour**, **role restriction logic in exchanged tokens**, and **DoS from unbounded key creation/listing**.

---

## Findings

### High

#### H1 — Any valid bearer token can create API keys

**Location**: `rest/AccountApiKeyResource.java:69-80`

`AccountApiKeyResource.authenticate()` accepts any bearer token that `BearerTokenAuthenticator` considers valid. There is no check on audience (`azp`), required scope, or required role for API key self-management.

**Impact**: A stolen or over-shared access token issued for any client in the realm can be converted into a more persistent credential (the API key), increasing blast radius.

**Recommendation**: Require a dedicated permission for self-service API key management:
- Token audience must include `account` or a dedicated API key management client
- Token must contain a dedicated scope or role (e.g. `manage-own-api-keys`)

```java
AuthResult auth = new AppAuthManager.BearerTokenAuthenticator(session).authenticate();
if (auth == null) throw new NotAuthorizedException("Bearer");

var token = auth.getToken();
if (!token.hasAudience("account")) {
    throw new ForbiddenException("Missing required audience");
}
```

---

#### H2 — Cookie-auth fallback enables CSRF on state-changing endpoints

**Location**: `rest/AccountApiKeyResource.java:52-58, 61-66, 69-79`

If bearer auth fails, the code falls back to `authenticateIdentityCookie()` for `POST` (create) and `DELETE` (revoke). There is no CSRF token, Origin/Referer validation, or same-origin enforcement.

**Impact**: An attacker can trick a logged-in browser into creating or revoking API keys via cross-site request. Creation is especially dangerous because it returns a durable credential.

**Recommendation**: For `POST`/`DELETE`, use bearer token only. Keep cookie auth only for safe `GET` operations if truly needed, or add CSRF protection + strict Origin checks.

---

#### H3 — Rate limiter resets on every request during fallback

**Location**: `protocol/ApiKeyGrantType.java:113-121`, `ratelimit/InMemoryRateLimiter.java:89-97`

When Infinispan is unavailable, the provider falls back to `InMemoryRateLimiter`. `ApiKeyGrantType` calls `updateConfig()` on every exchange, and `InMemoryRateLimiter.Entry.updateConfig()` recreates all token buckets, resetting them to full capacity.

**Impact**: During cache outage or misconfiguration, rate limiting is effectively disabled. Attackers can make unlimited exchange attempts.

**Recommendation**:
- Only recreate buckets when config actually changes
- Preserve counters across config updates
- Consider failing the grant with `503` instead of silent local fallback in production clusters

```java
if (!existingConfig.equals(newConfig)) {
    entry.reconfigurePreservingUsage(newConfig);
}
```

---

#### H4 — In-memory rate limiter is per-node only in clustered deployments

**Location**: `ratelimit/DefaultRateLimiterProvider.java:36-47`, `ratelimit/InMemoryRateLimiter.java:12-49`

Even if the reset bug (H3) is fixed, local in-memory fallback is per-node only.

**Impact**: An attacker can bypass effective rate limits by hitting multiple Keycloak nodes, or benefiting from restarts/failover.

**Recommendation**: In production, fail closed if the distributed limiter is unavailable. Explicitly support fallback only in single-node/dev mode via a configuration flag.

---

#### H5 — Role name collision across clients/realm enables privilege escalation

**Location**: `ApiKeyService.java:247-273`, `protocol/ApiKeyTokenHelper.java:58-89`

Validated roles are stored as plain strings (`"admin"`). Token restriction also filters by role name only. This loses namespace context — a realm role `admin` and a client role `admin` on different clients are indistinguishable.

**Impact**: An API key intended for one role context can preserve unintended roles in the exchanged JWT via name collision.

**Recommendation**: Store and enforce roles as fully-qualified identifiers:

```
realm:admin
client:orders-api:read
client:billing-api:admin
```

Then filter `realmAccess` and each `resourceAccess[client]` separately using the qualified prefix.

---

#### H6 — Unlimited key creation and unbounded listing enable DoS

**Location**: `rest/AccountApiKeyResource.java:43-58`, `rest/AdminApiKeyResource.java:47-60`, `jpa/JpaApiKeyRepository.java:31-63`, `ApiKeyService.java:179-203`

There is:
- No quota per user, client, or realm
- No pagination on list endpoints
- Realm-wide filtering done in memory after loading all entities
- `countAll()` loads all rows and uses `.size()`
- Metrics updates re-query all keys for a client on every create/revoke

**Impact**: A normal authenticated user can create large numbers of keys, causing DB growth, memory pressure, and slow admin listing.

**Recommendation**:
- Enforce quotas (e.g. max 25 active keys per user per client)
- Require max TTL via realm configuration
- Paginate all list endpoints (`?first=0&max=25`)
- Move filtering and counting to JPQL `WHERE` clauses and `COUNT` queries

---

### Medium

#### M1 — Missing input size and lifetime validation

**Location**: `dto/ApiKeyCreateRequest.java:12-17`, `ApiKeyService.java:53-73`, `META-INF/api-key-changelog.xml:18-19`

Validation is mostly "not blank". There are no explicit limits for:
- `name` length (DB column is `VARCHAR(255)` but no app-layer check)
- Number of roles/scopes per key
- Individual role/scope string length
- Maximum expiration lifetime
- Rejecting already-expired `expiresAt` timestamps

**Impact**: Large payloads can trigger 500 errors, DB exceptions, token bloat, or resource exhaustion.

**Recommendation**: Add explicit validation:
- `name` ≤ 100 characters
- Each role/scope ≤ 100 characters
- Max 20 roles and 20 scopes per key
- `expiresAt` must be in the future and ≤ a configurable max TTL

---

#### M2 — TOCTOU race on revocation allows one extra token

**Location**: `protocol/ApiKeyGrantType.java:74-89, 171-220`

Revocation/expiry is checked before token issuance, but there is no locking or version check tying the validation to token creation. A key revoked concurrently with an exchange can still produce one final token in a narrow race window.

**Impact**: One extra token minted after revocation. Impact is limited by the short token TTL.

**Recommendation**:
- Add `@Version` optimistic locking on `ApiKeyEntity`
- Re-check revocation status immediately before final token build and save
- Keep exchanged token TTL short

---

#### M3 — Auth sessions created for exchange are not explicitly cleaned up

**Location**: `protocol/ApiKeyGrantType.java:157-185`

The flow creates a `RootAuthenticationSessionModel`, `AuthenticationSessionModel`, and transient `UserSessionModel`. There is no explicit cleanup of the auth session after the token is built.

**Impact**: High-volume token exchange can accumulate temporary session state and contribute to memory/availability issues.

**Recommendation**: Explicitly remove the `RootAuthenticationSessionModel` once token issuance is complete.

---

### Low

#### L1 — Verbose error messages create a key-state oracle

**Location**: `protocol/ApiKeyGrantType.java:59-108`

The endpoint returns distinguishable error reasons:
- `"Invalid API key"`
- `"API key revoked"`
- `"API key expired"`
- `"Client ID does not match API key"`
- `"User disabled"`

**Impact**: Helps an attacker validate stolen/observed keys and probe internal state.

**Recommendation**: Return a generic `invalid_grant` error externally for all cases. Log the detailed reason server-side only.

---

#### L2 — Debug logging may leak authentication/session details

**Location**: `rest/AccountApiKeyResource.java:71-77`

```java
logger.debugf("Bearer auth result: %s", auth);
logger.debugf("Cookie auth result: %s", auth);
```

This serializes the full `AuthResult` object into logs when debug is enabled.

**Impact**: In debug-enabled environments, logs may expose token/session internals.

**Recommendation**: Log only minimal metadata:

```java
logger.debugf("Bearer auth: %s", auth != null ? "success (user=" + auth.getUser().getId() + ")" : "failed");
```

---

#### L3 — No server-side pepper on key hash

**Location**: `ApiKeyHasher.java:14-25`

Plain SHA-256 of the full API key. Given the keys are high-entropy and system-generated, this is acceptable — but HMAC with a server pepper would improve resilience against database-only compromise.

**Impact**: Relevant only in DB theft scenarios. Not the most urgent issue.

**Recommendation**: Use `HMAC-SHA-256(serverPepper, apiKey)` with the pepper sourced from Keycloak's vault or an environment variable.

---

## Non-Findings

These areas were reviewed and found to be secure:

| Area | Result |
|------|--------|
| **Key generation** | `SecureRandom` + 64 chars from 62-symbol alphabet — strong entropy |
| **Timing attacks** | Hash lookup via DB equality, no application-level string compare |
| **SQL injection** | All JPQL queries use named parameters |
| **JNDI injection** | Not present |
| **Header injection** | Custom headers are numeric rate-limit values only |
| **Cross-user access** | `revokeUserKey()` correctly checks `userId` ownership |
| **Admin auth bypass** | `AdminPermissionEvaluator` enforces `view-realm`/`manage-realm` |
| **Key hash exposure** | Hash is never returned in DTOs or events |
| **Transient sessions** | `SessionPersistenceState.TRANSIENT` prevents session persistence |

---

## Remediation Plan

### Sprint 1 — Critical path (this week)

| ID | Fix | Effort |
|----|-----|--------|
| H2 | Remove cookie-auth fallback from `POST`/`DELETE` — bearer-only for state-changing operations | Small |
| H3 | Fix `InMemoryRateLimiter.updateConfig()` to preserve counters when config hasn't changed | Small |
| H6 | Add per-user key quota (e.g. max 25 active keys) and reject creation beyond limit | Small |
| L1 | Normalize all grant-type error responses to generic `invalid_grant` — log details server-side only | Small |
| L2 | Replace debug logging with minimal metadata (success/failure + user ID) | Trivial |

### Sprint 2 — Hardening (next sprint)

| ID | Fix | Effort |
|----|-----|--------|
| H1 | Add audience/scope check on user endpoints — require `account` audience or `manage-own-api-keys` scope | Medium |
| H5 | Store roles as qualified identifiers (`realm:admin`, `client:my-app:read`) and filter separately per namespace | Medium |
| M1 | Add input validation: name ≤ 100, roles/scopes ≤ 20 each, `expiresAt` in future and ≤ max TTL | Small |
| M2 | Add `@Version` optimistic locking on `ApiKeyEntity` and re-check status before final token build | Medium |
| H6 | Add pagination to list endpoints, move filtering to JPQL `WHERE` clauses, use `COUNT` queries | Medium |

### Sprint 3 — Defense in depth (later)

| ID | Fix | Effort |
|----|-----|--------|
| H4 | Add configurable fail-closed mode for rate limiter in production (503 when distributed cache unavailable) | Medium |
| M3 | Explicitly remove `RootAuthenticationSessionModel` after token issuance | Small |
| L3 | Switch to `HMAC-SHA-256(serverPepper, apiKey)` with pepper from Keycloak vault or env var | Medium |
