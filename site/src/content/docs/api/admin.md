---
title: Admin API
description: Realm-admin REST endpoints for listing, creating, revoking and inspecting API keys.
---

The Admin API is mounted under the Keycloak Admin REST API:

```text
https://auth.example.com/admin/realms/{realm}/api-keys
```

| Method | Path | Required role | Description |
|--------|------|---------------|-------------|
| `GET` | `/api-keys` | `view-realm` | [List keys](#list-keys) |
| `POST` | `/api-keys/users/{userId}/api-keys` | `manage-realm` | [Create a key for a user](#create-key-for-user) |
| `DELETE` | `/api-keys/{keyId}` | `manage-realm` | [Revoke a key](#revoke-key) |
| `GET` | `/api-keys/{keyId}/stats` | `view-realm` | [Usage stats](#get-key-stats) |
| `GET` | `/api-keys/health` | `view-realm` | [Health](#health) |

There are no endpoints to fetch a single key or to update a key's name or expiry. To rotate a key, create a new one and revoke the old one.

## Authentication

Send an admin bearer token. The caller needs the `realm-management` client role shown in the table above for the target realm. Realm admins, and `admin` in the master realm, have both roles.

```bash
TOKEN=$(curl -s -X POST \
  "https://auth.example.com/realms/master/protocol/openid-connect/token" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=$ADMIN_PASSWORD" | jq -r '.access_token')
```

Without a token you get `401`. Without the required role you get `403`.

## List Keys

```http
GET /admin/realms/my-realm/api-keys?clientId=my-app&status=active&first=0&max=25
Authorization: Bearer {token}
```

| Query parameter | Default | Description |
|-----------------|---------|-------------|
| `userId` | — | Filter by owner user ID |
| `clientId` | — | Filter by client ID (the `clientId` string, not the internal UUID) |
| `status` | — | `active` (not revoked and not expired), `revoked`, or `expired` (not revoked, past `expiresAt`). Any other value returns `400`. |
| `first` | `0` | Offset |
| `max` | `25` | Page size. `0` or negative returns all matches. |

Results are ordered by `createdAt`, newest first.

**Response `200`:**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "CI pipeline",
    "userId": "e99f5394-1234-4abc-b678-9d0b1234abcd",
    "clientId": "my-app",
    "keyPrefix": "myapp_",
    "createdAt": 1768464000.123456000,
    "expiresAt": 1800000000.000000000,
    "lastUsedAt": 1773743400.987654000,
    "revokedAt": null,
    "usageCount": 42
  }
]
```

| Field | Description |
|-------|-------------|
| `id` | Key ID (UUID) |
| `name` | Label given at creation |
| `userId` | Owner's user ID |
| `clientId` | Client the key is bound to |
| `keyPrefix` | Derived prefix plus `_`. See [Key Prefixes](/keycloak-api-keys/configuration/prefixes/) |
| `createdAt` / `expiresAt` / `lastUsedAt` / `revokedAt` | Timestamps as epoch seconds with a fractional part. `expiresAt: null` means the key never expires. A non-null `revokedAt` means the key is revoked. |
| `usageCount` | Number of successful token exchanges |

## Create Key for User

Creates a key owned by `{userId}`. The admin who made the call is recorded as `created_by` in the event.

```bash
curl -X POST \
  "https://auth.example.com/admin/realms/my-realm/api-keys/users/$USER_ID/api-keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CI pipeline",
    "clientId": "my-app",
    "roles": ["deployer"],
    "scopes": ["deploy:write"],
    "expiresAt": "2027-01-15T08:00:00Z"
  }'
```

| Field | Required | Rules |
|-------|----------|-------|
| `name` | Yes | Non-blank, at most 100 characters |
| `clientId` | Yes | An existing, enabled client. The **user** must have a role mapping on it, unless the client is public. |
| `roles` | No | At most 20, each at most 100 characters. Each name is looked up as a client role, then as a realm role, and the user must hold it. Empty or omitted means the token carries no roles. |
| `scopes` | No | At most 20, each at most 100 characters. Each must be a default or optional scope of the client. Empty or omitted means default scopes only. |
| `expiresAt` | No | ISO 8601, for example `2027-01-15T08:00:00Z`. Must be in the future and no later than the realm's `apiKeysMaxTtlSeconds` (default 365 days). If omitted, the key never expires, unless the realm sets `apiKeysMaxTtlSeconds` explicitly, in which case the key gets that lifetime. |

A user can have at most **25 non-revoked keys per client**.

**Response `201`:**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "key": "myapp_Xk3vQ9pL2mN8rT4wY7zB1cD6fG0hJ5sA9eR2tU8iO3pK6lM1nV4bC7xZ0qW5yE2a",
  "name": "CI pipeline",
  "clientId": "my-app",
  "keyPrefix": "myapp_",
  "createdAt": 1768464000.123456000,
  "expiresAt": 1800000000.000000000,
  "lastUsedAt": null,
  "usageCount": 0
}
```

:::caution
`key` is returned only in this response. The server stores only its hash, so a lost key can't be recovered and must be replaced.
:::

## Revoke Key

Revokes any key in the realm, regardless of owner. It sets `revokedAt` and keeps the record.

```bash
curl -X DELETE \
  "https://auth.example.com/admin/realms/my-realm/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:** `204 No Content`, or `404` if the key does not exist in this realm. Revoked keys are rejected on their next token exchange. Revoking an already revoked key also returns `204`, keeps the original `revokedAt`, and emits no second event.

## Get Key Stats

```http
GET /admin/realms/my-realm/api-keys/{keyId}/stats
Authorization: Bearer {token}
```

**Response `200`:**

```json
{
  "usageCount": 15432,
  "lastUsedAt": "2026-03-18T10:00:00Z",
  "lastUsedIp": "203.0.113.42",
  "usageByDay": null
}
```

`usageByDay` is always `null`, because no per-day breakdown is collected yet. Returns `404` if the key does not exist in this realm.

## Health

```http
GET /admin/realms/my-realm/api-keys/health
Authorization: Bearer {token}
```

**Response `200`:**

```json
{
  "status": "UP",
  "keysCount": 128,
  "cacheStatus": "UP"
}
```

| Field | Description |
|-------|-------------|
| `status` | Always `UP` if the endpoint responds |
| `keysCount` | Total keys stored for the realm, including revoked and expired keys |
| `cacheStatus` | `UP` if the rate limiter is healthy. `DOWN` if it is not, for example when the `api-keys-rate-limit` cache is unavailable and `apiKeysRateLimitFailClosed=true`. The in-memory fallback, used when fail-closed is off, also reports `UP`: it enforces limits, but per node only. See [SPI Configuration](/keycloak-api-keys/configuration/spi/#rate-limit-cache). |

## kcctl extension

```http
GET /admin/realms/{realm}/api-keys/kcctl-extension
```

Off by default. Enable it with the `spi-admin-realm-restapi-extension--api-keys--kcctl-extension-enabled=true` option (see [SPI Configuration](/keycloak-api-keys/configuration/spi/#provider-options)); otherwise it returns `404`.

Returns a static [kcctl](https://github.com/emdzej/kcctl) extension manifest (`application/yaml`) describing the endpoints on this page. See kcctl's [extension docs](https://github.com/emdzej/kcctl/blob/main/docs/extensions.md#adding-kcctl-support-to-your-spi). kcctl fetches it with `kcctl extension discover`, which also runs after `kcctl auth login`. The `api-key` commands then become available:

```bash
kcctl api-key list --user alice --status active
kcctl api-key create alice --name ci --client my-app --role deployer --expires-at 2027-01-01T00:00:00Z
kcctl api-key stats <id>
kcctl api-key revoke <id>
```

`create` prints the plain key once, like the REST response. Requires `view-realm` and kcctl 0.2.0 or later. See [Managing Keys with kcctl](/keycloak-api-keys/getting-started/kcctl/) for a walkthrough. With older setups, or without discovery, install the manifest manually: `kcctl extension install kcctl-extension.yaml` (from `spi/src/main/resources/`).

## OpenAPI

The full REST surface, including the token exchange and the Account API, is described in [`docs/openapi.yaml`](https://github.com/emdzej/keycloak-api-keys/blob/main/docs/openapi.yaml) (OpenAPI 3.1).

## Errors

Errors use Keycloak's standard error handling. These are the conditions and their messages:

| Status | When |
|--------|------|
| `400` | Missing body; `name is required`; `clientId is required`; name, role or scope too long or too many; `expiresAt must be in the future`; `expiresAt exceeds the maximum allowed TTL of N days`; `Client is disabled`; `Role not found: …`; `Scope not allowed for client: …`; `Key quota exceeded: …`; `Unsupported status filter: …` |
| `401` | Missing or invalid admin token |
| `403` | Caller lacks `view-realm` / `manage-realm`; `User does not have access to client`; `Role not assigned to user: …` |
| `404` | `User not found`; `Client not found`; `API key not found` |

## Related Endpoints

These are not part of the Admin API:

- **User API:** `GET`, `POST` and `DELETE` at `/realms/{realm}/api-keys[/{keyId}]` let users manage their own keys. The bearer token must have `account` in `aud`. `GET` also accepts the Keycloak session cookie.
- **Token exchange:** `POST /realms/{realm}/protocol/openid-connect/token` with `grant_type=urn:ietf:params:oauth:grant-type:api-key`, `api_key` and the client credentials. The extension does not implement token introspection for API keys. Exchange the key for a JWT and validate that.
