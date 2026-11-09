---
title: SPI Configuration
description: Server-level setup for the Keycloak API Keys extension — providers, hashing pepper, rate-limit cache, events and metrics.
---

The extension has one `spi-*` option, which turns on the kcctl manifest endpoint. Everything else at server level is controlled by one environment variable, one Infinispan cache, and a few realm attributes.

## Registered Providers

Deploying the JAR registers these providers. You don't need to enable or select them.

| Keycloak SPI | Provider ID | Purpose |
|--------------|-------------|---------|
| `realm-restapi-extension` | `api-keys` | User API at `/realms/{realm}/api-keys` |
| `admin-realm-restapi-extension` | `api-keys` | Admin API at `/admin/realms/{realm}/api-keys` |
| `oauth2-grant-type` | `urn:ietf:params:oauth:grant-type:api-key` | Token exchange grant (shortcut `api_key`) |
| `jpa-entity-provider` | `api-key-entity-provider` | `api_key`, `api_key_roles`, `api_key_scopes` tables (Liquibase changelog) |
| `rateLimiter` (custom) | `default` | Rate limiting for token exchanges |
| `apiKeyMetrics` (custom) | `default` | Micrometer metrics |

## Provider Options

| Option | Default | Description |
|--------|---------|-------------|
| `spi-admin-realm-restapi-extension--api-keys--kcctl-extension-enabled` | `false` | Serve the [kcctl manifest](/keycloak-api-keys/api/admin/#kcctl-extension) at `/admin/realms/{realm}/api-keys/kcctl-extension`. When off, the endpoint returns `404`. |

Set it like any Keycloak option:

```bash
# command line
kc.sh start --spi-admin-realm-restapi-extension--api-keys--kcctl-extension-enabled=true

# environment variable
KC_SPI_ADMIN_REALM_RESTAPI_EXTENSION__API_KEYS__KCCTL_EXTENSION_ENABLED=true

# keycloak.conf
spi-admin-realm-restapi-extension--api-keys--kcctl-extension-enabled=true
```

## Hashing Pepper

| Environment variable | Required | Description |
|----------------------|----------|-------------|
| `API_KEY_PEPPER` | Recommended | Secret used for `HMAC-SHA-256(pepper, key)`. If unset or blank, keys are hashed with plain `SHA-256(key)`. |

The extension never stores the plain key. It stores only the hex-encoded hash.

- **Pepper set:** new keys are stored as HMAC-SHA-256. At lookup time the HMAC hash is tried first. If that fails, the plain SHA-256 hash is tried too, and a match is re-hashed to HMAC in place. Keys created before the pepper was set therefore keep working and get upgraded on their next use.
- **Pepper not set:** new keys are stored as SHA-256 and looked up only by SHA-256.

```yaml
# docker-compose.yml
services:
  keycloak:
    environment:
      API_KEY_PEPPER: ${API_KEY_PEPPER}   # e.g. output of: openssl rand -base64 32
```

:::caution
Once keys are stored as HMAC hashes, removing or changing `API_KEY_PEPPER` makes all of them unusable. Lookup does not fall back from a new pepper to an old one. Keep the pepper as stable as a database encryption key, and use the same value on every node.
:::

## Rate-Limit Cache

The rate limiter keeps its counters in an Infinispan cache named `api-keys-rate-limit`. If your Keycloak cache configuration doesn't define it, the extension creates it when it's first used:

- **Clustered Keycloak** (the default `ispn` cache stack with `kc.sh start`): a `distributed-cache` in `SYNC` mode, so limits apply across all nodes.
- **Single node** (`start-dev`, or `--cache=local`): a `local-cache`.

Each counter expires at the end of its window (second, minute, hour or day). To tune the cache, for example to cap its memory, define it yourself in the Keycloak cache config file and that definition is used instead:

```xml
<distributed-cache name="api-keys-rate-limit" owners="2">
    <expiration lifespan="86460000"/>
    <memory max-count="100000"/>
</distributed-cache>
```

If the cache can't be obtained, behaviour depends on the realm attribute `apiKeysRateLimitFailClosed`:

| `apiKeysRateLimitFailClosed` | Behaviour when Infinispan is unavailable |
|------------------------------|------------------------------------------|
| unset / `false` | Falls back to an in-memory limiter. Limits still apply, but each node counts separately |
| `true` | Every token exchange is rejected with `503 service_unavailable` |

Use `GET /admin/realms/{realm}/api-keys/health` to check the cache status. See [Admin API](/keycloak-api-keys/api/admin/#health).

## Realm Attributes

These are realm attributes, not SPI options:

| Attribute | Default | Description |
|-----------|---------|-------------|
| `apiKeysMaxTtlSeconds` | `31536000` (365 days) | Furthest allowed `expiresAt` when a key is created. Non-positive or non-numeric values fall back to the default. |
| `apiKeysRateLimitFailClosed` | `false` | See [Rate-Limit Cache](#rate-limit-cache) |
| `apiKeysRateLimits`, `apiKeysRateLimitPerMinute`, `…PerHour`, `…PerDay`, `…Burst` | see [Client Settings](/keycloak-api-keys/configuration/client/#rate-limits) | Realm-wide rate-limit defaults |

```bash
kcadm.sh update realms/my-realm \
  -s 'attributes.apiKeysMaxTtlSeconds=7776000' \
  -s 'attributes.apiKeysRateLimitFailClosed=true'
```

## Events

The extension writes to the Keycloak event store. Events are saved only if the realm has **Save events** enabled for the relevant types. Each event carries an `api_key_event` detail:

| `api_key_event` | Keycloak event type | Other details |
|-----------------|---------------------|---------------|
| `API_KEY_CREATED` | `UPDATE_CREDENTIAL` | `api_key_id`, `client_id`, `created_by` |
| `API_KEY_REVOKED` | `UPDATE_CREDENTIAL` | `api_key_id`, `client_id`, `revoked_by` |
| `API_KEY_EXCHANGED` | `OAUTH2_EXTENSION_GRANT` | `api_key_id`, `scope` |
| `API_KEY_RATE_LIMITED` | `OAUTH2_EXTENSION_GRANT_ERROR` (`access_denied`) | `api_key_id` |
| `API_KEY_EXPIRED_REJECTED` | `OAUTH2_EXTENSION_GRANT_ERROR` (`invalid_token`) | `api_key_id` |
| `API_KEY_EXCHANGE_UNAVAILABLE` | `OAUTH2_EXTENSION_GRANT_ERROR` (`not_allowed`) | `reason=rate_limiter_unhealthy` |

Other rejected exchanges are recorded as `OAUTH2_EXTENSION_GRANT_ERROR` without an `api_key_event` detail. Their `reason` detail names the specific cause, even though the caller only ever sees the generic `Invalid API key or unauthorized`:

| `reason` | Cause |
|----------|-------|
| `api_key_missing` | No `api_key` parameter |
| `api_key_not_found` | No key with this value |
| `realm_mismatch` | The key belongs to another realm |
| `api_key_revoked` | The key was revoked |
| `api_key_expired` | The key is past `expiresAt` |
| `client_id_mismatch` | The key was issued for a different client |
| `user_not_found` / `user_disabled` | The key's owner was deleted or disabled |

Custom providers can also subscribe to these `ProviderEvent` records on the session factory: `ApiKeyCreatedEvent`, `ApiKeyRevokedEvent`, `ApiKeyExchangedEvent`, `ApiKeyRateLimitedEvent` and `ApiKeyExpiredRejectedEvent`.

## Metrics

Metrics are registered in Micrometer's global registry. They are exposed when Keycloak metrics are enabled (`KC_METRICS_ENABLED=true`).

| Meter | Type | Tags |
|-------|------|------|
| `keycloak_api_keys_exchanges_total` | Counter | `realm`, `client`, `result` (`success`, `invalid`, `revoked`, `expired`, `rate_limited`, `service_unavailable`) |
| `keycloak_api_keys_exchange_duration_seconds` | Timer | `realm`, `client` |
| `keycloak_api_keys_rate_limited_total` | Counter | `realm`, `client` |
| `keycloak_api_keys_total` | Gauge | `realm`, `client`, `status` (`active`, `revoked`, `expired`) |

The key-count gauge is updated only when a key is created or revoked for that client.

## Next Steps

- [Client Settings](/keycloak-api-keys/configuration/client/) — Per-client rate limits and requirements
- [Key Prefixes](/keycloak-api-keys/configuration/prefixes/) — Key format and prefix derivation
