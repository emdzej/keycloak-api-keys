---
title: Quick Start
description: Create and use your first API key in 5 minutes.
---

# Quick Start

This guide will have you creating and validating API keys in under 5 minutes.

## Prerequisites

- Keycloak with API Keys SPI installed ([Installation](/keycloak-api-keys/getting-started/installation/))
- A realm and confidential client configured

## Step 1: Configure a Client

1. Open the Keycloak Admin Console
2. Navigate to your realm → **Clients**
3. Select or create a confidential client
4. Go to the **API Keys** tab
5. Enable API Keys for this client
6. Set a **Key Prefix** (e.g., `myapp`)

## Step 2: Create an API Key

Using the Admin API:

```bash
# Get an admin token
ADMIN_TOKEN=$(curl -s -X POST \
  "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | jq -r '.access_token')

# Create an API key
curl -X POST \
  "http://localhost:8080/admin/realms/my-realm/clients/{client-id}/api-keys" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My First Key"}'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My First Key",
  "prefix": "myapp",
  "key": "myapp_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

:::caution
Save the `key` value immediately! It's only shown once and cannot be retrieved later.
:::

## Step 3: Validate the Key

Use standard OAuth2 token introspection:

```bash
curl -X POST \
  "http://localhost:8080/realms/my-realm/protocol/openid-connect/token/introspect" \
  -d "client_id=my-client" \
  -d "client_secret=my-secret" \
  -d "token=myapp_a1b2c3d4e5f6..."
```

Response:
```json
{
  "active": true,
  "client_id": "my-client",
  "token_type": "api_key",
  "scope": "openid profile",
  "api_key_id": "550e8400-e29b-41d4-a716-446655440000",
  "api_key_name": "My First Key"
}
```

## Step 4: Use in Your Application

With the Node.js middleware:

```typescript
import express from 'express';
import { apiKeyAuth } from '@emdzej/keycloak-api-keys-node';

const app = express();

app.use(apiKeyAuth({
  keycloakUrl: 'http://localhost:8080',
  realm: 'my-realm',
  clientId: 'my-client',
  clientSecret: 'my-secret',
}));

app.get('/api/protected', (req, res) => {
  console.log('API Key:', req.apiKey.name);
  res.json({ message: 'Hello from protected route!' });
});

app.listen(3000);
```

Test it:

```bash
curl http://localhost:3000/api/protected \
  -H "X-API-Key: myapp_a1b2c3d4e5f6..."
```

## Next Steps

- [Client Settings](/keycloak-api-keys/configuration/client/) — Configure key expiration, rate limits
- [Middleware](/keycloak-api-keys/middleware/java/) — Integrate with your stack
- [API Reference](/keycloak-api-keys/api/admin/) — Full API documentation
