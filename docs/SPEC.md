# Keycloak API Keys — Specification

## 1. Overview

### 1.1 Problem Statement

Keycloak provides robust OAuth 2.0 / OIDC authentication but lacks native API key support. API keys are essential for:
- Machine-to-machine communication where OAuth flows are impractical
- Developer-facing APIs (public APIs, integrations)
- Simplified authentication for scripts and CLI tools
- Long-lived credentials without refresh token complexity

### 1.2 Solution

Extend Keycloak with:
1. **API Key Storage & Management** — create, list, revoke keys
2. **Token Exchange Grant** — exchange API key for JWT
3. **User & Admin UI** — self-service and administrative management
4. **Client Libraries** — middleware for popular frameworks

### 1.3 Design Principles

- **Keycloak as Authority** — all validation happens in Keycloak, no local JWT-style validation
- **Client-scoped Keys** — API keys are always issued for a specific client (application)
- **Granular Permissions** — keys can have restricted roles/scopes compared to the user
- **Audit Trail** — full logging of key usage

---

## 2. Data Model

### 2.1 API Key Entity

```
ApiKey {
  id: UUID                    # Internal ID
  keyHash: String             # SHA-256 hash of the key (never store plain)
  keyPrefix: String           # First 8 chars for identification (e.g., "mk_live_")
  name: String                # User-friendly name (e.g., "CI/CD Pipeline")
  
  userId: String              # Owner user ID
  clientId: String            # Associated client (application)
  realmId: String             # Realm
  
  roles: String[]             # Assigned roles (subset of user's roles)
  scopes: String[]            # Assigned scopes (subset of client's scopes)
  
  expiresAt: Timestamp        # Expiration date (nullable = never expires)
  revokedAt: Timestamp        # Revocation timestamp (nullable = active)
  
  rateLimitPerMinute: Integer # Rate limit (nullable = use client default)
  rateLimitPerHour: Integer
  rateLimitPerDay: Integer
  
  lastUsedAt: Timestamp       # Last successful usage
  lastUsedIp: String          # IP of last usage
  usageCount: Long            # Total usage count
  
  createdAt: Timestamp
  createdBy: String           # User or admin who created
  metadata: JSON              # Custom metadata (optional)
}
```

### 2.2 Key Format

```
Format: {prefix}_{randomBytes}
Example: myapp_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

Components:
- prefix: Configurable per client (default: client_id shortened)
- separator: underscore
- random: 64 characters (base62: a-z, A-Z, 0-9)

Total length: prefix + 1 + 64 = ~70 characters

Prefix examples:
- Client "my-awesome-app" → prefix "myapp" or custom "maa_prod"
- Client "billing-service" → prefix "billing" or custom "bs_live"
```

### 2.3 Storage

- **Database**: Keycloak's JPA entity in realm schema
- **Hashing**: SHA-256 (key is shown once on creation, then only hash stored)
- **Indexing**: keyHash (unique), userId+clientId, expiresAt

---

## 3. API Design

### 3.1 User API (Account Console)

Base path: `/realms/{realm}/account/api-keys`

#### List Keys
```
GET /realms/{realm}/account/api-keys
Authorization: Bearer {access_token}

Response: {
  "keys": [
    {
      "id": "uuid",
      "name": "CI Pipeline",
      "keyPrefix": "mk_live_a1b2",
      "clientId": "my-app",
      "roles": ["user", "api-access"],
      "scopes": ["read", "write"],
      "expiresAt": "2027-01-01T00:00:00Z",
      "lastUsedAt": "2026-03-17T10:30:00Z",
      "createdAt": "2026-01-15T08:00:00Z"
    }
  ]
}
```

#### Create Key
```
POST /realms/{realm}/account/api-keys
Authorization: Bearer {access_token}
Content-Type: application/json

Request: {
  "name": "CI Pipeline",
  "clientId": "my-app",
  "roles": ["api-access"],           // Optional: subset of user's roles
  "scopes": ["read"],                // Optional: subset of client's scopes
  "expiresAt": "2027-01-01T00:00:00Z", // Optional
  "metadata": {}                      // Optional
}

Response: {
  "id": "uuid",
  "key": "mk_live_a1b2c3d4...",      // ⚠️ Only returned ONCE
  "name": "CI Pipeline",
  "clientId": "my-app",
  ...
}
```

#### Revoke Key
```
DELETE /realms/{realm}/account/api-keys/{keyId}
Authorization: Bearer {access_token}

Response: 204 No Content
```

### 3.2 Admin API

Base path: `/admin/realms/{realm}/api-keys`

#### List All Keys (with filters)
```
GET /admin/realms/{realm}/api-keys?userId={userId}&clientId={clientId}&status=active
Authorization: Bearer {admin_token}
```

#### Create Key for User
```
POST /admin/realms/{realm}/users/{userId}/api-keys
Authorization: Bearer {admin_token}
```

#### Revoke Any Key
```
DELETE /admin/realms/{realm}/api-keys/{keyId}
Authorization: Bearer {admin_token}
```

#### Get Key Statistics
```
GET /admin/realms/{realm}/api-keys/{keyId}/stats
Authorization: Bearer {admin_token}

Response: {
  "usageCount": 15432,
  "lastUsedAt": "...",
  "lastUsedIp": "...",
  "usageByDay": [...]
}
```

### 3.3 Token Exchange API

```
POST /realms/{realm}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:api-key
api_key=mk_live_a1b2c3d4...
client_id=my-app                    // Must match key's clientId
client_secret=xxx                   // If client is confidential

Response: {
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "read write"
}
```

**Token contains:**
- `sub`: User ID (key owner)
- `azp`: Client ID
- `roles`: Intersection of (user roles ∩ key roles)
- `scope`: Intersection of (client scopes ∩ key scopes)
- `api_key_id`: Reference to the key used
- Standard JWT claims

---

## 4. Rate Limiting

### 4.1 Configuration Levels

1. **Realm default** — applies to all keys in realm
2. **Client default** — applies to all keys for client
3. **Per-key override** — specific key settings

### 4.2 Limits

| Limit | Default | Configurable |
|-------|---------|--------------|
| Per minute | 60 | Yes |
| Per hour | 1000 | Yes |
| Per day | 10000 | Yes |
| Burst | 10 | Yes |

### 4.3 Response on Limit

```
HTTP 429 Too Many Requests
{
  "error": "rate_limit_exceeded",
  "error_description": "API key rate limit exceeded",
  "retry_after": 45
}

Headers:
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1710687600
```

---

## 5. Audit Logging

### 5.1 Events

| Event | Data |
|-------|------|
| `API_KEY_CREATED` | keyId, userId, clientId, createdBy |
| `API_KEY_REVOKED` | keyId, userId, revokedBy |
| `API_KEY_EXCHANGED` | keyId, userId, clientId, ip |
| `API_KEY_RATE_LIMITED` | keyId, userId, limit |
| `API_KEY_EXPIRED_REJECTED` | keyId, userId |

### 5.2 Storage

- Keycloak Event Store (standard)
- Optional: External event listener (Kafka, webhook)

---

## 6. Security Considerations

### 6.1 Key Storage
- Keys are hashed with SHA-256 before storage
- Plain key shown only once on creation
- No way to recover key — must create new one

### 6.2 Key Transmission
- Always HTTPS
- Keys should be treated like passwords
- Recommend short-lived keys where possible

### 6.3 Scope Restriction
- Key can only have **subset** of user's roles
- Key can only have **subset** of client's scopes
- Cannot escalate privileges via API key

### 6.4 Revocation
- Immediate effect (no token caching)
- Admin can revoke any key
- User can revoke own keys

---

## 7. Authorization (Admin Roles)

### 9.1 New Roles

New client roles in `realm-management`:

| Role | Description |
|------|-------------|
| `view-api-keys` | Read-only access to all API keys in realm |
| `manage-api-keys` | Full CRUD access to all API keys in realm |

These roles are **independent** — `manage-api-keys` does NOT automatically include `view-api-keys`.
Admins needing full access should be assigned both roles.

### 9.2 Endpoint Authorization

| Endpoint | Method | Required Role |
|----------|--------|---------------|
| `/account/api-keys` | GET | *(authenticated user)* |
| `/account/api-keys` | POST | *(authenticated user)* |
| `/account/api-keys/{id}` | DELETE | *(authenticated user, own key only)* |
| `/admin/.../api-keys` | GET | `view-api-keys` OR `manage-api-keys` |
| `/admin/.../api-keys/{id}/stats` | GET | `view-api-keys` OR `manage-api-keys` |
| `/admin/.../users/{id}/api-keys` | POST | `manage-api-keys` |
| `/admin/.../api-keys/{id}` | DELETE | `manage-api-keys` |

### 9.3 Role Composites

For convenience, realm admins can create composite roles:

```
api-keys-admin (composite)
├── view-api-keys
└── manage-api-keys
```

### 9.4 No Inheritance from User Roles

API key roles are intentionally separate from `view-users` / `manage-users`:
- Principle of least privilege
- API keys may contain sensitive scopes
- Separate audit trail for key management vs user management

Organizations wanting combined access can create composite roles manually

---

## 8. Client Libraries

### 9.1 Spring Security

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .addFilterBefore(
                new KeycloakApiKeyFilter(keycloakConfig),
                UsernamePasswordAuthenticationFilter.class
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").authenticated()
            );
        return http.build();
    }
}

// Usage - principal is populated from exchanged JWT
@GetMapping("/api/data")
public Data getData(@AuthenticationPrincipal KeycloakPrincipal principal) {
    String userId = principal.getSubject();
    // ...
}
```

### 9.2 Express.js

```javascript
import { keycloakApiKey } from '@keycloak/api-keys-express';

const app = express();

app.use('/api', keycloakApiKey({
  realm: 'my-realm',
  serverUrl: 'https://keycloak.example.com',
  clientId: 'my-app',
  clientSecret: process.env.CLIENT_SECRET
}));

app.get('/api/data', (req, res) => {
  const userId = req.auth.sub;
  // ...
});
```

### 9.3 Hono

```typescript
import { keycloakApiKey } from '@keycloak/api-keys-hono';

const app = new Hono();

app.use('/api/*', keycloakApiKey({
  realm: 'my-realm',
  serverUrl: 'https://keycloak.example.com',
  clientId: 'my-app',
  clientSecret: Bun.env.CLIENT_SECRET
}));

app.get('/api/data', (c) => {
  const userId = c.get('auth').sub;
  // ...
});
```

---

## 9. UI Components

### 9.1 Account Console

New section in Account Console: **"API Keys"**

Features:
- List user's API keys (name, client, expires, last used)
- Create new key (with role/scope selection)
- Copy key to clipboard (on creation)
- Revoke key (with confirmation)

### 9.2 Admin Console

New section under Users: **"API Keys"**

Features:
- List all keys (filterable by user, client, status)
- Create key for any user
- Revoke any key
- View usage statistics
- Bulk revoke (e.g., all keys for a user)

Realm Settings → API Keys:
- Configure default rate limits
- Configure key prefix
- Enable/disable API keys for realm

---

## 10. Implementation Phases

### Phase 1: Core SPI (MVP)
- [ ] Data model & JPA entities
- [ ] REST API (user + admin)
- [ ] Token exchange grant type
- [ ] Basic rate limiting (in-memory)

### Phase 2: UI
- [ ] Account Console extension
- [ ] Admin Console extension

### Phase 3: Client Libraries
- [ ] Spring Security integration
- [ ] Express.js middleware
- [ ] Hono middleware

### Phase 4: Production Hardening
- [ ] Distributed rate limiting (Redis/Infinispan)
- [ ] Metrics & monitoring
- [ ] Documentation & examples

---

## 11. Open Questions

1. **Key rotation** — should we support automatic rotation with grace period?
2. **IP allowlist** — restrict key usage to specific IPs?
3. **Webhook notifications** — notify on key creation/revocation?
4. **Service account keys** — special handling for service accounts?

---

## 12. Appendix A: Configuration

### Realm Configuration

```json
{
  "apiKeys": {
    "enabled": true,
    "defaultExpiration": "P1Y",
    "maxKeysPerUser": 10,
    "rateLimits": {
      "perMinute": 60,
      "perHour": 1000,
      "perDay": 10000
    }
  }
}
```

### Client Configuration

```json
{
  "apiKeysEnabled": true,
  "apiKeysPrefix": "myapp_live",
  "apiKeysRateLimits": {
    "perMinute": 100
  }
}
```
