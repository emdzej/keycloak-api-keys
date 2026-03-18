# API Reference

All endpoints are available in the **Bruno collection** at `bruno/` in the repository root.
Open the collection in [Bruno](https://usebruno.com), select the `LOCAL` environment, set
the `apiKey` variable, and all requests are ready to run.

---

## Table of Contents

- [Authentication](#authentication)
- [Common Types](#common-types)
- [User API](#user-api)
  - [List Keys](#list-keys)
  - [Create Key](#create-key)
  - [Revoke Key](#revoke-key)
  - [Health](#user-health)
- [Admin API](#admin-api)
  - [List All Keys](#list-all-keys)
  - [Create Key for User](#create-key-for-user)
  - [Revoke Any Key](#revoke-any-key)
  - [Get Key Stats](#get-key-stats)
  - [Health](#admin-health)
- [Token Exchange](#token-exchange)
- [Middleware Options](#middleware-options)
  - [Express](#express)
  - [Fastify](#fastify)
  - [Hono](#hono)
  - [Spring Boot](#spring-boot)
- [Error Responses](#error-responses)

---

## Authentication

### User API

Send a valid Keycloak Bearer token in the `Authorization` header. Any non-expired token
issued by the realm is accepted — no specific role is required. The server enforces
ownership: users can only access their own keys.

```
Authorization: Bearer <access_token>
```

### Admin API

Send a Bearer token for a user who holds the `view-realm` or `manage-realm` role in the
`realm-management` client. Realm administrators have both roles by default.

```
Authorization: Bearer <admin_access_token>
```

### Token Exchange

The token exchange endpoint uses standard OAuth2 client authentication — handled by
Keycloak before the grant type runs:

- **Public clients** (e.g. `admin-cli`, `account-console`) — `client_id` only, no secret
- **Confidential clients** — `client_id` + `client_secret`

---

## Common Types

### `ApiKeyResponse`

Returned when listing a user's own keys.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Internal key ID |
| `name` | `string` | Human-readable label |
| `clientId` | `string` | The OAuth2 client this key is bound to |
| `keyPrefix` | `string` | First characters of the key for identification |
| `createdAt` | `string` (ISO 8601) | Creation timestamp |
| `expiresAt` | `string` (ISO 8601) \| `null` | Expiry, null = never expires |
| `lastUsedAt` | `string` (ISO 8601) \| `null` | Last successful token exchange |
| `usageCount` | `number` | Total number of token exchanges |

### `ApiKeyCreatedResponse`

Returned only on key creation. Contains the plain key — **store it immediately, it is never shown again**.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Internal key ID |
| `key` | `string` | ⚠️ Full API key — shown once only |
| `name` | `string` | |
| `clientId` | `string` | |
| `keyPrefix` | `string` | |
| `createdAt` | `string` (ISO 8601) | |
| `expiresAt` | `string` (ISO 8601) \| `null` | |
| `lastUsedAt` | `null` | Always null on creation |
| `usageCount` | `0` | Always 0 on creation |

### `AdminApiKeyResponse`

Returned when listing keys via the admin API. Includes the owner's `userId` and `revokedAt`.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | |
| `name` | `string` | |
| `userId` | `string` (UUID) | Key owner |
| `clientId` | `string` | |
| `keyPrefix` | `string` | |
| `createdAt` | `string` (ISO 8601) | |
| `expiresAt` | `string` (ISO 8601) \| `null` | |
| `lastUsedAt` | `string` (ISO 8601) \| `null` | |
| `revokedAt` | `string` (ISO 8601) \| `null` | Non-null = revoked |
| `usageCount` | `number` | |

### `ApiKeyCreateRequest`

Request body for creating a key (user or admin endpoint).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `string` | Yes | Human-readable label |
| `clientId` | `string` | Yes | Must be a valid client in the realm |
| `roles` | `string[]` | No | Subset of the owner user's roles; empty = no roles in token |
| `scopes` | `string[]` | No | Subset of the client's scopes; empty = default scopes only |
| `expiresAt` | `string` (ISO 8601) | No | Omit for a non-expiring key |

---

## User API

Base URL: `http://localhost:8080/realms/{realm}/api-keys`

### List Keys

Returns all non-deleted API keys owned by the authenticated user.

```
GET /realms/{realm}/api-keys
Authorization: Bearer {token}
Accept: application/json
```

**Response `200`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "CI Pipeline",
    "clientId": "my-app",
    "keyPrefix": "myapp_a1b2",
    "createdAt": "2026-01-15T08:00:00Z",
    "expiresAt": "2027-01-15T08:00:00Z",
    "lastUsedAt": "2026-03-17T10:30:00Z",
    "usageCount": 42
  }
]
```

---

### Create Key

Creates a new API key for the authenticated user. The plain key is returned **once only**.

```
POST /realms/{realm}/api-keys
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

**Request body**

```json
{
  "name": "CI Pipeline",
  "clientId": "my-app",
  "roles": ["api-access"],
  "scopes": ["read", "write"],
  "expiresAt": "2027-01-15T08:00:00Z"
}
```

**Response `201`**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "key": "myapp_EMrTFCBhQII1AmBEuE7WEQBm9WMe3OhRzIgRNd9rN802yaTucdcnKdu5SfGimmJc",
  "name": "CI Pipeline",
  "clientId": "my-app",
  "keyPrefix": "myapp_EMrT",
  "createdAt": "2026-03-18T10:00:00Z",
  "expiresAt": "2027-01-15T08:00:00Z",
  "lastUsedAt": null,
  "usageCount": 0
}
```

---

### Revoke Key

Revokes a key owned by the authenticated user. Revocation is immediate — any subsequent
token exchange with this key will fail. Middleware caches will continue to serve cached
tokens until they expire naturally.

```
DELETE /realms/{realm}/api-keys/{keyId}
Authorization: Bearer {token}
```

**Response `204 No Content`**

**Response `404`** if the key does not exist or belongs to a different user.

---

### User Health

Public endpoint — no authentication required.

```
GET /realms/{realm}/api-keys/health
```

**Response `200`**

```json
{ "status": "ok" }
```

---

## Admin API

Base URL: `http://localhost:8080/admin/realms/{realm}/api-keys`

Requires `view-realm` (read operations) or `manage-realm` (write operations) in the
`realm-management` client.

### List All Keys

Returns all keys in the realm, with optional filters.

```
GET /admin/realms/{realm}/api-keys
Authorization: Bearer {admin_token}
Accept: application/json
```

**Query parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Filter by owner user ID |
| `clientId` | `string` | Filter by client ID |
| `status` | `active` \| `revoked` | Filter by revocation status; omit for all |

**Response `200`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "CI Pipeline",
    "userId": "e99f5394-1234-4abc-b678-9d0b1234abcd",
    "clientId": "my-app",
    "keyPrefix": "myapp_a1b2",
    "createdAt": "2026-01-15T08:00:00Z",
    "expiresAt": "2027-01-15T08:00:00Z",
    "lastUsedAt": "2026-03-17T10:30:00Z",
    "revokedAt": null,
    "usageCount": 42
  }
]
```

---

### Create Key for User

Creates an API key on behalf of any user in the realm.

```
POST /admin/realms/{realm}/api-keys/users/{userId}/api-keys
Authorization: Bearer {admin_token}
Content-Type: application/json
Accept: application/json
```

**Path parameters**

| Parameter | Description |
|-----------|-------------|
| `userId` | Keycloak user ID of the key owner |

**Request body** — same as [User Create Key](#create-key)

**Response `201`** — same shape as [ApiKeyCreatedResponse](#apikeycreatedresponse)

**Response `404`** if the user does not exist.

---

### Revoke Any Key

Revokes any key in the realm regardless of owner.

```
DELETE /admin/realms/{realm}/api-keys/{keyId}
Authorization: Bearer {admin_token}
```

**Response `204 No Content`**

**Response `404`** if the key does not exist in the realm.

---

### Get Key Stats

Returns usage statistics for a specific key.

```
GET /admin/realms/{realm}/api-keys/{keyId}/stats
Authorization: Bearer {admin_token}
Accept: application/json
```

**Response `200`**

```json
{
  "usageCount": 15432,
  "lastUsedAt": "2026-03-18T10:00:00Z",
  "lastUsedIp": "203.0.113.42"
}
```

**Response `404`** if the key does not exist.

---

### Admin Health

Returns the health of the SPI, including the rate limiter cache status.

```
GET /admin/realms/{realm}/api-keys/health
Authorization: Bearer {admin_token}
Accept: application/json
```

**Response `200`**

```json
{
  "status": "UP",
  "keysCount": 128,
  "cacheStatus": "UP"
}
```

`cacheStatus` is `DOWN` when the Infinispan rate-limit cache is unavailable (falls back to
in-memory in that case).

---

## Token Exchange

Exchange an API key for a short-lived JWT access token using the custom OAuth2 grant type.

```
POST /realms/{realm}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded
```

**Request parameters**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `grant_type` | Yes | `urn:ietf:params:oauth:grant-type:api-key` |
| `api_key` | Yes | The full API key value |
| `client_id` | Yes | Must match the `clientId` the key was created for |
| `client_secret` | Conditional | Required if the client is confidential |

**Response `200`**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIn0...",
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "openid profile email"
}
```

**JWT claims**

| Claim | Description |
|-------|-------------|
| `sub` | User ID (key owner) |
| `azp` | Client ID the key is bound to |
| `api_key_id` | ID of the API key used for this exchange |
| `realm_access.roles` | Realm roles filtered to the key's granted roles |
| `resource_access` | Client roles filtered to the key's granted roles |
| `scope` | Scopes resolved by Keycloak's mapper pipeline, constrained to the key's granted scopes |
| `iss`, `iat`, `exp`, `jti`, `sid` | Standard JWT claims |

Roles and scopes are **filtered down** from what Keycloak's protocol mappers produce — a key
can never escalate privileges beyond what a normal user session would have.

**Error responses**

| Status | `error` | Cause |
|--------|---------|-------|
| `400` | `invalid_grant` | Key not found, revoked, expired, or realm mismatch |
| `401` | `invalid_client` | Client authentication failed, or `client_id` does not match key |
| `429` | `rate_limit_exceeded` | Key has exceeded its rate limit |

On `429`, the following headers are included:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1710687600
Retry-After: 45
```

---

## Middleware Options

All middleware packages read the API key from `X-API-Key` by default and attach the decoded
JWT claims to the request for use in route handlers. On a cache miss the key is exchanged
for a JWT at the Keycloak token endpoint; the result is cached for
`min(cacheTtl, token.expires_in)` seconds.

### Express

```typescript
import { keycloakApiKey } from '@emdzej/keycloak-api-keys-express';

app.use('/api', keycloakApiKey(options));

// In a route handler:
app.get('/api/me', (req, res) => {
  const { sub, azp, api_key_id, realm_access, scope } = req.auth;
});
```

**Options**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serverUrl` | `string` | — | Keycloak base URL |
| `realm` | `string` | — | Realm name |
| `clientId` | `string` | — | OAuth2 client ID |
| `clientSecret` | `string` | `undefined` | Client secret (omit for public clients) |
| `headerName` | `string` | `"X-API-Key"` | Request header to read the key from |
| `cacheTtl` | `number` | `300` | Cache TTL in seconds |

**`req.auth` shape**

| Field | Type |
|-------|------|
| `sub` | `string` |
| `azp` | `string` |
| `api_key_id` | `string` |
| `realm_access` | `{ roles: string[] }` \| `undefined` |
| `scope` | `string` \| `undefined` |
| `[key]` | `unknown` — any other JWT claim |

---

### Fastify

```typescript
import { keycloakApiKeyPlugin } from '@emdzej/keycloak-api-keys-fastify';

await fastify.register(keycloakApiKeyPlugin, options);

// In a route handler:
fastify.get('/api/me', async (request) => {
  const { sub, azp, api_key_id, realm_access, scope } = request.auth;
});
```

**Options** — same as Express plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prefix` | `string` | `"/api"` | Only protect routes whose URL starts with this prefix |

`request.auth` has the same shape as Express `req.auth`.

---

### Hono

```typescript
import { keycloakApiKey } from '@emdzej/keycloak-api-keys-hono';

app.use('/api/*', keycloakApiKey(options));

// In a route handler:
app.get('/api/me', (c) => {
  const { sub, azp, api_key_id, realm_access, scope } = c.get('auth');
});
```

**Options** — same as Express. Auth claims are stored in the Hono context variable `auth`
(`c.get('auth')`).

---

### Spring Boot

Auto-configured via `spring-boot-autoconfigure`. The filter is registered automatically
when the library is on the classpath.

```java
// SecurityConfig.java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http,
                                       KeycloakApiKeyConfigurer configurer) throws Exception {
    configurer.configure(http);
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/health").permitAll()
        .anyRequest().authenticated()
    );
    return http.build();
}

// Route handler
@GetMapping("/api/me")
public Map<String, Object> me(Authentication authentication) {
    ApiKeyAuthenticationToken token = (ApiKeyAuthenticationToken) authentication;
    return token.getClaims();   // full JWT claim map
}
```

**`application.yml`**

```yaml
keycloak:
  api-keys:
    server-url: ${KEYCLOAK_URL:http://localhost:8080}
    realm: ${KEYCLOAK_REALM:master}
    client-id: ${CLIENT_ID:admin-cli}
    client-secret: ${CLIENT_SECRET:}   # omit / leave blank for public clients
    header-name: ${API_KEY_HEADER:X-API-Key}
    cache-ttl: ${CACHE_TTL:PT5M}
```

| Property | Env variable | Default | Description |
|----------|-------------|---------|-------------|
| `keycloak.api-keys.server-url` | `KEYCLOAK_URL` | — | Keycloak base URL |
| `keycloak.api-keys.realm` | `KEYCLOAK_REALM` | — | Realm name |
| `keycloak.api-keys.client-id` | `CLIENT_ID` | — | OAuth2 client ID |
| `keycloak.api-keys.client-secret` | `CLIENT_SECRET` | `null` | Omit for public clients |
| `keycloak.api-keys.header-name` | `API_KEY_HEADER` | `X-API-Key` | Request header to read the key from |
| `keycloak.api-keys.cache-ttl` | `CACHE_TTL` | `PT5M` | Cache TTL as ISO 8601 duration |

**`ApiKeyAuthenticationToken`**

| Method | Returns |
|--------|---------|
| `getClaims()` | `Map<String, Object>` — full JWT claim map |
| `getPrincipal()` | `Map<String, Object>` — same as `getClaims()` |
| `getName()` | `sub` claim value |
| `getAuthorities()` | Realm roles as `ROLE_<roleName>` Spring authorities |

The filter also accepts the API key via `Authorization: ApiKey <key>` in addition to
`X-API-Key`. If a `SecurityContext` authentication is already present the filter skips
processing (compatible with other authentication mechanisms).

---

## Error Responses

### Middleware errors (Express / Fastify / Hono)

| Status | Cause |
|--------|-------|
| `401` | No `X-API-Key` header, or Keycloak rejected the key |
| `429` | Keycloak rate-limited the key — `X-RateLimit-*` headers forwarded from Keycloak |
| `5xx` | Unexpected error — passed to the framework's error handler (`next(error)`) |

### Middleware errors (Spring Boot)

| Status | Body | Cause |
|--------|------|-------|
| `401` | `{"error":"invalid_api_key","error_description":"..."}` | No key, or Keycloak rejected it |
| `401` | `{"error":"invalid_token","error_description":"..."}` | JWT decode failed |
