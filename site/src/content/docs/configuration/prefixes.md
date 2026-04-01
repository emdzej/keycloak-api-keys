---
title: Key Prefixes
description: Configure and use API key prefixes.
---

# Key Prefixes

Every API key has a prefix that identifies which client it belongs to.

## Format

```
{prefix}_{random_key}
```

Example:
```
myapp_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

## Why Prefixes?

1. **Identification** — Know which application a key belongs to at a glance
2. **Security** — Quickly identify leaked keys in logs or code
3. **Routing** — Middleware can route requests based on prefix
4. **Audit** — Filter logs by prefix

## Setting a Prefix

### Admin Console

1. **Clients** → Select client → **API Keys** tab
2. Set the **Key Prefix** field

### REST API

```bash
curl -X PUT ".../clients/{client-id}" \
  -d '{"attributes": {"api-keys.prefix": "myapp"}}'
```

## Prefix Requirements

| Rule | Description |
|------|-------------|
| Length | 2-20 characters |
| Characters | Lowercase letters, numbers, hyphens |
| Start | Must start with a letter |
| Uniqueness | Must be unique within the realm |

Valid examples:
- `myapp`
- `api-v2`
- `service1`

Invalid examples:
- `1app` (starts with number)
- `My_App` (uppercase, underscore)
- `a` (too short)

## Prefix Validation

The SPI validates prefixes on key creation:

```bash
# This will fail - prefix too short
curl -X POST ".../api-keys" \
  -d '{"name": "test"}' \
  # Error: "Prefix 'x' is too short (minimum 2 characters)"

# This will fail - invalid characters  
curl -X POST ".../api-keys" \
  -d '{"name": "test"}' \
  # Error: "Prefix 'My_App' contains invalid characters"
```

## Changing Prefixes

:::caution
Changing a client's prefix does **not** update existing keys. Old keys will continue to work but will have the old prefix.
:::

If you need to rotate prefixes:

1. Create new keys with the new prefix
2. Update applications to use new keys
3. Revoke old keys

## Prefix Strategies

### By Environment

```
myapp-prod_xxx
myapp-staging_xxx
myapp-dev_xxx
```

### By Service

```
auth-svc_xxx
payment-svc_xxx
notify-svc_xxx
```

### By Version

```
api-v1_xxx
api-v2_xxx
```

## Next Steps

- [Middleware](/keycloak-api-keys/middleware/java/) — Use keys in your applications
- [API Reference](/keycloak-api-keys/api/admin/) — Full API documentation
