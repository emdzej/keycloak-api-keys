# Keycloak API Keys — Specification

## Overview

### Problem Statement

Keycloak provides robust OAuth 2.0 / OIDC authentication but lacks native API key support. API keys are essential for:
- Machine-to-machine communication where OAuth flows are impractical
- Developer-facing APIs (public APIs, integrations)
- Simplified authentication for scripts and CLI tools
- Long-lived credentials without refresh token complexity

### Solution

Extend Keycloak with:
1. **API Key Storage & Management** — create, list, revoke keys
2. **Token Exchange Grant** — exchange API key for JWT
3. **Account Console UI** — user self-service management
4. **Client Libraries** — middleware for popular frameworks

### Design Principles

- **Keycloak as Authority** — all validation happens in Keycloak, no local JWT-style validation
- **Client-scoped Keys** — API keys are always issued for a specific client (application)
- **Granular Permissions** — keys can have restricted roles/scopes compared to the user
- **Audit Trail** — full logging of key usage

---

## Data Model

### API Key Entity

```
ApiKey {
  id: UUID                    # Internal ID
  keyHash: String             # SHA-256 hash of the key (never store plain)
  keyPrefix: String           # First 8 chars for identification (e.g., "myapp_a1b2")
  name: String                # User-friendly name (e.g., "CI/CD Pipeline")

  userId: String              # Owner user ID
  clientId: String            # Associated client (application)
  realmId: String             # Realm

  roles: String[]             # Granted roles (subset of user's roles)
  scopes: String[]            # Granted scopes (subset of client's scopes)
  rateLimitConfigJson: String # Optional JSON rate limit override (see Configuration)

  expiresAt: Timestamp        # Expiration date (null = never expires)
  revokedAt: Timestamp        # Revocation timestamp (null = active)

  lastUsedAt: Timestamp       # Last successful usage
  lastUsedIp: String          # IP of last usage
  usageCount: Long            # Total usage count

  createdAt: Timestamp
}
```

### Key Format

```
Format: {clientIdPrefix}_{randomBytes}
Example: admincli_EMrTFCBhQII1AmBEuE7WEQBm9WMe3OhRzIgRNd9rN802yaTucdcnKdu5SfGimmJc

Components:
- prefix: first segment of clientId (up to first hyphen or 8 chars)
- separator: underscore
- random: 64 characters (base62: a-z, A-Z, 0-9)
```

### Storage

- **Database**: Keycloak's JPA entity, tables created via Liquibase on startup
- **Hashing**: SHA-256 (key is shown once on creation, then only the hash is stored)
- **Indexes**: `key_hash` (unique), `realm_id + user_id`, `realm_id`
- **Collection tables**: `api_key_roles`, `api_key_scopes` (FK → `api_key.id`, CASCADE DELETE)

---

## API Design

### User API

Base path: `/realms/{realm}/api-keys`

> Mounted via `RealmResourceProvider` (factory ID `api-keys`). Requests to
> `/realms/{realm}/account/api-keys` with `Accept: application/json` are intercepted
> by Keycloak's `AccountLoader` before reaching custom SPIs, so the user REST API is
> served at the realm path instead.

#### List Keys
```
GET /realms/{realm}/api-keys
Authorization: Bearer {access_token}

Response 200: [
  {
    "id": "uuid",
    "name": "CI Pipeline",
    "keyPrefix": "myapp_a1b2",
    "clientId": "my-app",
    "roles": ["user", "api-access"],
    "scopes": ["read", "write"],
    "expiresAt": "2027-01-01T00:00:00Z",
    "lastUsedAt": "2026-03-17T10:30:00Z",
    "createdAt": "2026-01-15T08:00:00Z",
    "usageCount": 42
  }
]
```

#### Create Key
```
POST /realms/{realm}/api-keys
Authorization: Bearer {access_token}
Content-Type: application/json

Request: {
  "name": "CI Pipeline",
  "clientId": "my-app",
  "roles": ["api-access"],              // Optional: subset of user's roles
  "scopes": ["read"],                   // Optional: subset of client's scopes
  "expiresAt": "2027-01-01T00:00:00Z"  // Optional
}

Response 201: {
  "id": "uuid",
  "key": "myapp_a1b2c3d4...",           // ⚠️ Only returned ONCE
  "name": "CI Pipeline",
  "clientId": "my-app",
  "keyPrefix": "myapp_a1b2",
  "createdAt": "...",
  "expiresAt": "..."
}
```

#### Revoke Key
```
DELETE /realms/{realm}/api-keys/{keyId}
Authorization: Bearer {access_token}

Response: 204 No Content
```

#### Health
```
GET /realms/{realm}/api-keys/health

Response 200: { "status": "ok" }
```

### Admin API

Base path: `/admin/realms/{realm}/api-keys`

> Mounted via `AdminRealmResourceProviderFactory`. Requires the caller to be
> authenticated as an admin user with appropriate realm-management roles (see Authorization).

#### List All Keys
```
GET /admin/realms/{realm}/api-keys?userId={userId}&clientId={clientId}&status=active|revoked
Authorization: Bearer {admin_token}

Response 200: [
  {
    "id": "uuid",
    "name": "CI Pipeline",
    "userId": "user-uuid",
    "clientId": "my-app",
    "keyPrefix": "myapp_a1b2",
    "createdAt": "...",
    "expiresAt": "...",
    "lastUsedAt": "...",
    "revokedAt": null,
    "usageCount": 42
  }
]
```

#### Create Key for User
```
POST /admin/realms/{realm}/api-keys/users/{userId}/api-keys
Authorization: Bearer {admin_token}
Content-Type: application/json

Request: same shape as user Create Key above

Response 201: same shape as user Create Key response
```

#### Revoke Any Key
```
DELETE /admin/realms/{realm}/api-keys/{keyId}
Authorization: Bearer {admin_token}

Response: 204 No Content
```

#### Get Key Statistics
```
GET /admin/realms/{realm}/api-keys/{keyId}/stats
Authorization: Bearer {admin_token}

Response 200: {
  "usageCount": 15432,
  "lastUsedAt": "2026-03-18T10:00:00Z",
  "lastUsedIp": "203.0.113.42"
}
```

#### Health
```
GET /admin/realms/{realm}/api-keys/health
Authorization: Bearer {admin_token}   // view-realm required

Response 200: {
  "status": "UP",
  "keysCount": 128,
  "cacheStatus": "UP"
}
```

### Token Exchange

```
POST /realms/{realm}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:api-key
api_key=myapp_a1b2c3d4...
client_id=my-app                    // Must match the key's clientId
client_secret=xxx                   // Only required for confidential clients

Response 200: {
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "openid profile"
}
```

**JWT contains:**
- `sub` — user ID (key owner)
- `azp` — client ID the key is bound to
- `api_key_id` — ID of the API key used
- `realm_access.roles` — intersection of mapper-produced roles and API key's granted roles
- `resource_access` — same intersection for client roles
- `scope` — scopes resolved by Keycloak's mapper pipeline, constrained to the API key's granted scopes
- Standard Keycloak claims (`iss`, `iat`, `exp`, `jti`, `sid`, etc.)

> Roles and scopes in the token are filtered **down** from what protocol mappers produce —
> they are never escalated beyond what the user's session would normally contain.

---

## Rate Limiting

### Configuration Levels

Resolution order (first non-null wins per field):

```
per-key → client → realm → built-in defaults
```

### Defaults

| Limit | Default |
|-------|---------|
| Per minute | 60 |
| Per hour | 1000 |
| Per day | 10000 |
| Burst | 10 |

### Response on Limit

```
HTTP 429 Too Many Requests

Headers:
  X-RateLimit-Limit: 60
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1710687600
  Retry-After: 45
```

### Infinispan Cache

The rate limiter uses an Infinispan cache named `api-keys-rate-limit`. In `start-dev` mode
Keycloak falls back to an in-memory cache automatically. For production, add to `infinispan.xml`:

```xml
<local-cache name="api-keys-rate-limit">
    <expiration lifespan="60000"/>
    <memory max-count="10000"/>
</local-cache>
```

---

## Audit Logging

Keycloak events emitted on key lifecycle and usage:

| Event | Details |
|-------|---------|
| `API_KEY_CREATED` | keyId, userId, clientId |
| `API_KEY_REVOKED` | keyId, userId, revokedBy |
| `API_KEY_EXCHANGED` | keyId, userId, clientId, ip |
| `API_KEY_RATE_LIMITED` | keyId, userId, limit |
| `API_KEY_EXPIRED_REJECTED` | keyId, userId |

Events are stored in the Keycloak Event Store and can be consumed by any registered
Keycloak `EventListenerProvider` (e.g. for Kafka or webhook forwarding).

---

## Security

### Key Storage
- Keys are hashed with SHA-256 before storage — the plain key is never persisted
- The plain key is returned only once, at creation time
- There is no recovery mechanism — a lost key must be revoked and recreated

### Key Transmission
- Always use HTTPS in production
- Treat API keys like passwords — rotate regularly, limit scope to what is needed
- Prefer short-lived keys (`expiresAt`) over permanent ones

### Scope and Role Restriction
- A key's roles must be a **subset** of the owner user's roles at token exchange time
- A key's scopes must be a **subset** of the client's configured scopes
- Protocol mappers run first, then roles/scopes are filtered down — privilege escalation via API key is not possible

### Revocation
- Revocation takes effect immediately on the next token exchange
- Middleware token caches will serve cached tokens until they expire naturally (TTL = `min(cacheTtl, token.expires_in)`)
- To force immediate invalidation, set `cacheTtl: 0` in the middleware options

---

## Authorization

### User Endpoints

`/realms/{realm}/api-keys` authenticates via `BearerTokenAuthenticator`. Any valid,
non-expired Bearer token from the realm is accepted — no specific role is required.
Ownership is enforced server-side: users can only list, create, and revoke their own keys.

### Admin Endpoints

Uses Keycloak's built-in `AdminPermissionEvaluator` — no custom roles are created.

| Endpoint | Required permission |
|----------|---------------------|
| `GET /admin/.../api-keys` | `view-realm` |
| `GET /admin/.../api-keys/{id}/stats` | `view-realm` |
| `GET /admin/.../api-keys/health` | `view-realm` |
| `POST /admin/.../api-keys/users/{id}/api-keys` | `manage-realm` |
| `DELETE /admin/.../api-keys/{id}` | `manage-realm` |

`view-realm` and `manage-realm` are standard roles in Keycloak's `realm-management` client,
already assigned to realm administrators. No additional configuration is required.

---

## Client Libraries

All middleware packages share the same options shape and behaviour. The API key is read
from the `X-API-Key` request header (configurable). On a cache miss the middleware
exchanges the key for a JWT via the token endpoint and caches the decoded claims for
`min(cacheTtl, token.expires_in)` seconds.

### Spring Security

```java
// build.gradle.kts
implementation("pl.emdzej.keycloak:keycloak-api-keys-spring:0.1.0")

// SecurityConfig.java
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           KeycloakApiKeyConfigurer configurer) throws Exception {
        configurer.configure(http);
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/health").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}

# application.yml
keycloak:
  api-keys:
    server-url: ${KEYCLOAK_URL:https://keycloak.example.com}
    realm: ${KEYCLOAK_REALM:my-realm}
    client-id: ${CLIENT_ID:my-app}
    client-secret: ${CLIENT_SECRET:}   # omit for public clients
    cache-ttl: ${CACHE_TTL:PT5M}

// Route handler
@GetMapping("/api/data")
public Data getData(Authentication auth) {
    String userId = auth.getName();   // sub claim
    // ...
}
```

### Express.js

```typescript
import express from 'express';
import { keycloakApiKey } from '@emdzej/keycloak-api-keys-express';

const app = express();

app.use('/api', keycloakApiKey({
  serverUrl: 'https://keycloak.example.com',
  realm: 'my-realm',
  clientId: 'my-app',
  // clientSecret: process.env.CLIENT_SECRET   // only for confidential clients
  cacheTtl: 300
}));

app.get('/api/data', (req, res) => {
  const userId = req.auth.sub;
  // ...
});
```

### Fastify

```typescript
import Fastify from 'fastify';
import { keycloakApiKeyPlugin } from '@emdzej/keycloak-api-keys-fastify';

const fastify = Fastify();

await fastify.register(keycloakApiKeyPlugin, {
  serverUrl: 'https://keycloak.example.com',
  realm: 'my-realm',
  clientId: 'my-app',
  prefix: '/api',
  cacheTtl: 300
});

fastify.get('/api/data', async (request) => {
  const userId = request.auth.sub;
  // ...
});
```

### Hono

```typescript
import { Hono } from 'hono';
import { keycloakApiKey } from '@emdzej/keycloak-api-keys-hono';

const app = new Hono();

app.use('/api/*', keycloakApiKey({
  serverUrl: 'https://keycloak.example.com',
  realm: 'my-realm',
  clientId: 'my-app',
  cacheTtl: 300
}));

app.get('/api/data', (c) => {
  const userId = c.get('auth').sub;
  // ...
});
```

---

## Account Console UI

An API Keys page is injected into the Keycloak Account Console via the `AccountResourceProvider`
SPI and a `content.json` extension. It is served as a React module loaded by the account console's
`ContentComponent`.

Features implemented:
- List the authenticated user's API keys (name, client, prefix, expiry, last used)
- Create a new key (name, clientId, optional expiry, optional roles/scopes)
- Revoke a key (with confirmation)
- Copy the plain key to clipboard on creation (shown once only)

The UI is built with Vite as an ES module (`packages/content/api-keys/api-keys.js`) and
loaded via the account console's import map — React and PatternFly are provided by the
host bundle, not bundled into the extension.

---

## Project Structure

```
keycloak-api-keys/
├── spi/                          # Keycloak SPI (Java 21, Gradle)
│   └── src/main/java/
│       └── pl/emdzej/keycloak/apikeys/
│           ├── jpa/              # JPA entity + Liquibase changelog
│           ├── protocol/         # api-key grant type
│           ├── ratelimit/        # Rate limiter (Infinispan / in-memory)
│           ├── rest/             # User + admin JAX-RS resources
│           └── ...
│
├── account-ui/                   # Account Console extension (TypeScript, Vite)
│   └── src/
│
├── packages/
│   ├── spring/                   # Spring Security integration (Java 21, Gradle)
│   ├── express/                  # Express middleware (TypeScript)
│   ├── fastify/                  # Fastify plugin (TypeScript)
│   ├── hono/                     # Hono middleware (TypeScript)
│   ├── express-demo/             # Express demo app (port 3001)
│   ├── fastify-demo/             # Fastify demo app (port 3002)
│   ├── hono-demo/                # Hono demo app (port 3003)
│   └── spring-demo/              # Spring Boot demo app (port 3004)
│
├── bruno/                        # Bruno API collection
└── docker-compose.yml            # Keycloak + PostgreSQL
```

### Build Commands

```bash
# Build SPI JAR for Keycloak
./gradlew :spi:shadowJar

# Build all TypeScript packages
pnpm build

# Run tests
./gradlew :spi:test
pnpm test

# Run a demo
pnpm --filter @emdzej/keycloak-api-keys-express-demo dev
./gradlew :packages:spring-demo:bootRun
```

---

## Appendix: Configuration

There is no global enable/disable flag, no default expiration, and no per-client key prefix
in the current implementation. The only runtime configuration is rate limiting.

### Rate Limit Attributes

Set on realm or client via custom attributes (Admin Console → Realm Settings / Clients → Attributes).

| Attribute | Description |
|-----------|-------------|
| `apiKeysRateLimitPerMinute` | Integer string, e.g. `"120"` |
| `apiKeysRateLimitPerHour` | Integer string |
| `apiKeysRateLimitPerDay` | Integer string |
| `apiKeysRateLimitBurst` | Integer string |

All four can also be set as a single JSON blob in `apiKeysRateLimits`:

```json
{ "perMinute": 120, "perHour": 2000, "perDay": 20000, "burst": 20 }
```

Client-level attributes override realm-level. Per-key `rateLimitConfigJson` overrides both.
The first non-null value per field wins; partial overrides are supported.
