---
title: Client Settings
description: How a Keycloak client affects API keys, and the client attributes that control rate limiting.
---

There is no per-client "Enable API Keys" switch, no key quota setting, no default expiration and no prefix attribute. Any enabled client in the realm can have keys. The only client-level settings are **rate-limit attributes**.

## What the Client Controls

Each key is bound to one client, identified by its `clientId`. The client's existing Keycloak configuration determines what the key can do:

| Aspect | Behaviour |
|--------|-----------|
| Availability | The client must exist and be enabled when the key is created |
| Who can create keys | The key owner must have at least one role mapping on the client, unless the client is public |
| Roles | Requested `roles` must exist on the client or the realm, and the owner must hold them |
| Scopes | Requested `scopes` must be default or optional client scopes of the client |
| Token exchange | The request is authenticated as this client (with `client_secret` if the client is confidential). It must use the same `clientId` the key was created for. |
| Prefix | Derived from the `clientId`. See [Key Prefixes](/keycloak-api-keys/configuration/prefixes/) |

Keys are limited to **25 non-revoked keys per user per client**. This limit is hardcoded.

### Roles in the Token

During token exchange, Keycloak's normal protocol-mapper pipeline runs. Then `realm_access` and `resource_access` are **filtered** down to the roles stored on the key. A key with no roles yields a token with no realm or client roles. The extension never adds roles a normal session would not have.

### Scopes in the Token

A key with no scopes gets the client's default scopes. A key with scopes gets the default scopes plus those of its scopes that are still attached to the client.

## Rate Limits

Rate limits are applied per key on each token exchange. Values are resolved field by field. The first value found wins:

1. Per-key config (`rate_limit_config` column; no API currently sets it)
2. Client attribute `apiKeysRateLimits` (JSON)
3. Client attributes `apiKeysRateLimitPerMinute` / `PerHour` / `PerDay` / `Burst`
4. Realm attribute `apiKeysRateLimits` (JSON)
5. Realm attributes `apiKeysRateLimitPerMinute` / `PerHour` / `PerDay` / `Burst`
6. Built-in defaults

| Attribute | JSON field | Default | Window |
|-----------|------------|---------|--------|
| `apiKeysRateLimitPerMinute` | `perMinute` | `60` | 1 minute |
| `apiKeysRateLimitPerHour` | `perHour` | `1000` | 1 hour |
| `apiKeysRateLimitPerDay` | `perDay` | `10000` | 1 day |
| `apiKeysRateLimitBurst` | `burst` | `10` | 1 second |

`apiKeysRateLimits` accepts either a flat object or one nested under `rateLimits`:

```json
{ "perMinute": 120, "perHour": 2000, "perDay": 20000, "burst": 30 }
```

`burst` caps short spikes: at most `burst` exchanges in any one second, on top of the per-minute, hour and day limits. With the defaults a key can make 10 calls in a second but still only 60 in a minute.

- An exchange is rejected if any window is exceeded. Rejected exchanges don't count against the other windows.
- `0` or a negative value disables that window. Because the first value found wins, a client can set `0` to lift a limit that the realm sets.
- Non-numeric values are skipped, and the next level is used.
- Rejected exchanges return `429` with a `Retry-After` header and `error: "rate_limit_exceeded"` plus `retry_after` (seconds) in the body.
- Successful and rejected exchanges include `X-RateLimit-Limit` (the per-minute value), `X-RateLimit-Remaining` and `X-RateLimit-Reset` (epoch seconds).

### Setting Client Attributes

The Admin Console has no editor for arbitrary client attributes. Use `kcadm.sh` or the Admin REST API instead:

```bash
# Look up the internal ID of my-app
CID=$(kcadm.sh get clients -r my-realm -q clientId=my-app --fields id --format csv --noquotes)

# Per-field attributes
kcadm.sh update clients/$CID -r my-realm \
  -s 'attributes.apiKeysRateLimitPerMinute=120' \
  -s 'attributes.apiKeysRateLimitBurst=30'

# Or a single JSON attribute
kcadm.sh update clients/$CID -r my-realm \
  -s 'attributes.apiKeysRateLimits={"perMinute":120,"perHour":2000,"perDay":20000,"burst":30}'
```

Realm-wide defaults use the same attribute names on the realm (`kcadm.sh update realms/my-realm -s 'attributes.apiKeysRateLimitPerMinute=120'`).

## Realm-Only Attributes

These are read from the **realm**. Setting them on a client has no effect:

| Attribute | Default | Description |
|-----------|---------|-------------|
| `apiKeysMaxTtlSeconds` | `31536000` (365 days) | Furthest allowed `expiresAt`. When set explicitly, keys created without `expiresAt` get this lifetime. When unset, they never expire. |
| `apiKeysRateLimitFailClosed` | `false` | Reject exchanges with `503` if the rate-limit cache is unavailable |

## Example: Read-Only Keys

To limit a key to a read-only role and scope, create the role and scope on the client, assign them to the user, and request them when creating the key:

```bash
curl -X POST "https://auth.example.com/realms/my-realm/api-keys" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Reporting job",
    "clientId": "my-app",
    "roles": ["reports-reader"],
    "scopes": ["reports:read"]
  }'
```

Tokens exchanged with this key carry only the `my-app` client role `reports-reader`. Their scopes are the client's default scopes plus `reports:read`. Roles are looked up on the client first, then on the realm, and stored fully qualified, so a realm role with the same name is not included.

The user API requires a bearer token whose `aud` claim includes `account`.

## Next Steps

- [Key Prefixes](/keycloak-api-keys/configuration/prefixes/) — How the key prefix is derived
- [Admin API](/keycloak-api-keys/api/admin/) — Manage keys across the realm
