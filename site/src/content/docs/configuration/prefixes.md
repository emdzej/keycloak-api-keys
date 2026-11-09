---
title: Key Prefixes
description: API key format and how the prefix is derived from the client ID.
---

Every API key starts with a prefix derived from the client it was created for. The prefix **is not configurable**. It is computed from the client's `clientId` at creation time, and there is no prefix attribute or validation step.

## Key Format

```text
{prefix}_{random}
```

| Part | Value |
|------|-------|
| `prefix` | Derived from `clientId` (see below), 1–15 characters, `[a-z0-9]` |
| `_` | Separator |
| `random` | 64 characters from `[A-Za-z0-9]`, generated with `SecureRandom` (about 381 bits of entropy) |

Example for client `my-app`:

```text
myapp_Xk3vQ9pL2mN8rT4wY7zB1cD6fG0hJ5sA9eR2tU8iO3pK6lM1nV4bC7xZ0qW5yE2a
```

The full key is returned once, in the `key` field of the create response. The `keyPrefix` field, which is stored and returned in listings, holds the prefix including the separator, e.g. `myapp_`.

## Prefix Derivation

1. Remove every character that is not an ASCII letter or digit.
2. If nothing remains, use `api`.
3. Truncate to 15 characters.
4. Lowercase.

| `clientId` | Prefix |
|------------|--------|
| `my-app` | `myapp` |
| `Billing.Service_v2` | `billingservicev` |
| `very-long-client-identifier` | `verylongclienti` |
| `https://app.example.com` | `httpsappexample` |
| `---` | `api` |

## What the Prefix Is (and Isn't)

- **Identification only.** It helps you recognise which client a key belongs to in logs, config files or secret scanners.
- **Not used for lookup.** Keys are found by hash: HMAC-SHA-256 with `API_KEY_PEPPER`, or SHA-256 without it. The client binding comes from the stored key record, not the prefix.
- **Not unique.** Different clients can share a prefix. For example, `my-app` and `myapp` both produce `myapp`, and clients whose IDs share the first 15 alphanumeric characters collide too.

To give keys distinct, meaningful prefixes, choose client IDs accordingly, e.g. `billing-prod` → `billingprod`, `billing-staging` → `billingstaging`.

## Renaming a Client

:::caution
Keys store the `clientId` string they were created for. Token exchange compares it with the authenticating client's current `clientId`. If you rename a client's `clientId`, all of its existing keys stop working (`401 invalid_client`), not just their prefix. Create new keys after renaming and revoke the old ones.
:::

## Next Steps

- [Client Settings](/keycloak-api-keys/configuration/client/) — Rate limits and client requirements
- [Admin API](/keycloak-api-keys/api/admin/) — Manage keys across the realm
