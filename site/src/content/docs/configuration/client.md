---
title: Client Settings
description: Configure API key settings per client.
---

# Client Settings

Each Keycloak client can have its own API key configuration.

## Enabling API Keys

1. Navigate to **Clients** → Select your client
2. Go to the **API Keys** tab
3. Toggle **Enable API Keys**

## Configuration Options

| Setting | Description |
|---------|-------------|
| **Enable API Keys** | Allow API key creation for this client |
| **Key Prefix** | Prefix for all keys (e.g., `myapp`) |
| **Max Keys** | Maximum number of active keys per client (0 = unlimited) |
| **Key Expiration** | Default expiration for new keys (0 = never) |
| **Rate Limit** | Requests per minute per key (0 = unlimited) |

## REST API Configuration

You can also configure clients via the Admin API:

```bash
curl -X PUT \
  "http://localhost:8080/admin/realms/{realm}/clients/{client-id}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": {
      "api-keys.enabled": "true",
      "api-keys.prefix": "myapp",
      "api-keys.max-keys": "10",
      "api-keys.default-expiration": "0",
      "api-keys.rate-limit": "1000"
    }
  }'
```

## Client Attributes Reference

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `api-keys.enabled` | boolean | `false` | Enable API keys |
| `api-keys.prefix` | string | client ID | Key prefix |
| `api-keys.max-keys` | integer | `0` | Max active keys |
| `api-keys.default-expiration` | integer | `0` | Expiration in seconds |
| `api-keys.rate-limit` | integer | `0` | Requests per minute |

## Scopes and Roles

API keys inherit the client's configuration:

- **Client scopes** — Keys have access to the client's assigned scopes
- **Service account roles** — If the client has a service account, keys inherit its roles

This means you control API key permissions through standard Keycloak client configuration.

## Example: Read-Only API Keys

Create a client with limited scopes:

```bash
# Create client with read-only scope
curl -X POST ".../clients" -d '{
  "clientId": "readonly-api",
  "defaultClientScopes": ["read-only"],
  "attributes": {
    "api-keys.enabled": "true",
    "api-keys.prefix": "ro"
  }
}'
```

Keys created for this client will only have the `read-only` scope.

## Next Steps

- [Key Prefixes](/keycloak-api-keys/configuration/prefixes/) — Prefix naming conventions
- [API Reference](/keycloak-api-keys/api/admin/) — Full API documentation
