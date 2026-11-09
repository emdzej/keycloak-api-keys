---
title: Quick Start
description: Create an API key and call a protected API in a few minutes.
---

This walkthrough uses the local Docker setup and the built-in `admin-cli` client, so nothing has to be configured first. For a real deployment, swap in your own realm and client.

## 1. Start Keycloak

```bash
git clone https://github.com/emdzej/keycloak-api-keys.git
cd keycloak-api-keys
./scripts/dev.sh
```

Keycloak comes up at `http://localhost:8080` (`admin` / `admin`) with the provider installed.

## 2. Create a key

### In the Account Console

Set the realm's account theme to `api-keys` (see [Installation](/keycloak-api-keys/getting-started/installation/#enable-the-account-console-ui)). Then open `http://localhost:8080/realms/master/account`, go to **API Keys**, and create a key for a client.

### With the REST API

Users create keys for themselves at `/realms/{realm}/api-keys`, authenticated with their own access token:

```bash
TOKEN=$(curl -s http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d grant_type=password -d client_id=admin-cli \
  -d username=admin -d password=admin | jq -r .access_token)

curl -s -X POST http://localhost:8080/realms/master/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-first-key", "clientId": "admin-cli"}'
```

```json
{
  "id": "6f1c…",
  "key": "admincli_Xk9fQ2mT7vLp3RwYb8NcZ1aHs5JdG4eKu6iOy0tBqVxW2nMr7FgEj3hPl9Cz",
  "name": "my-first-key",
  "clientId": "admin-cli",
  "keyPrefix": "admincli_",
  "createdAt": "2026-11-09T10:30:00Z",
  "expiresAt": null
}
```

:::caution
Copy the `key` now. Only its hash is stored, so it can't be shown again.
:::

The request body also accepts `roles`, `scopes` and `expiresAt` to narrow what the key can do. You can only grant roles you have yourself. The user needs a role on the client, unless the client is public.

## 3. Exchange it for a token

This is what the middleware does on every cache miss:

```bash
curl -s http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d grant_type=urn:ietf:params:oauth:grant-type:api-key \
  -d client_id=admin-cli \
  -d api_key=admincli_Xk9fQ2… | jq
```

You get a standard token response. The `access_token` is a normal Keycloak JWT with an extra `api_key_id` claim. Confidential clients also need `client_secret`, and the `client_id` must be the one the key was created for.

## 4. Protect an API

With Express:

```bash
pnpm add @emdzej/keycloak-api-keys-express express
```

```ts
import express from 'express';
import { keycloakApiKey } from '@emdzej/keycloak-api-keys-express';

const app = express();

app.use('/api', keycloakApiKey({
  serverUrl: 'http://localhost:8080',
  realm: 'master',
  clientId: 'admin-cli',
}));

app.get('/api/profile', (req, res) => {
  res.json({ userId: req.auth?.sub, apiKeyId: req.auth?.api_key_id });
});

app.listen(3000);
```

```bash
curl http://localhost:3000/api/profile -H "X-API-Key: admincli_Xk9fQ2…"
# {"userId":"…","apiKeyId":"6f1c…"}
```

The repository has the same demo for every supported stack. See the [README](https://github.com/emdzej/keycloak-api-keys#demo-applications).

## Next steps

- [Middleware](/keycloak-api-keys/middleware/node/): Node.js, Spring and .NET integrations
- [Client Settings](/keycloak-api-keys/configuration/client/): rate limits and key lifetime
- [Admin API](/keycloak-api-keys/api/admin/): manage keys for other users
