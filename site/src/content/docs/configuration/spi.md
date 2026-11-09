---
title: SPI Configuration
description: Server-level setup for the Keycloak API Keys extension — providers, hashing pepper, rate-limit cache, events and metrics.
---

The extension has **no `spi-*` configuration options**. None of its provider factories read from Keycloak's `Config.Scope`, so there is nothing to put in `keycloak.conf` or `KC_SPI_*` variables. Server-level behaviour is controlled by one environment variable, one Infinispan cache, and a few realm attributes.

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

The rate limiter uses an Infinispan cache named `api-keys-rate-limit`. The extension does not ship a cache definition, so add one to your Infinispan configuration:

```xml
<local-cache name="api-keys-rate-limit">
    <expiration lifespan="86400000"/>
    <memory max-count="10000"/>
</local-cache>
```

Each entry sets its own lifespan to match its window (minute, hour or day). Use a distributed or replicated cache if you want limits enforced across the whole cluster.

If the cache can't be obtained, behaviour depends on the realm attribute `apiKeysRateLimitFailClosed`:

| `apiKeysRateLimitFailClosed` | Behaviour when Infinispan is unavailable |
|------------------------------|------------------------------------------|
| unset / `false` | Falls back to an in-memory limiter |
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

Other rejected exchanges, such as an unknown or revoked key, a client mismatch or a disabled user, are recorded as `OAUTH2_EXTENSION_GRANT_ERROR` without an `api_key_event` detail. The `reason` detail holds the error message returned to the caller (for example `Invalid API key or unauthorized`), not the specific cause.

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
