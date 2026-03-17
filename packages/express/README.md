# @keycloak-api-keys/express

Express.js middleware for validating Keycloak API keys and attaching decoded auth info to the request.

## Installation

```bash
pnpm add @keycloak-api-keys/express express
```

## Usage

```ts
import express from 'express';
import { keycloakApiKey } from '@keycloak-api-keys/express';

const app = express();

app.use(
  '/api',
  keycloakApiKey({
    realm: 'my-realm',
    serverUrl: 'https://keycloak.example.com',
    clientId: 'my-app',
    clientSecret: process.env.CLIENT_SECRET
  })
);

app.get('/api/data', (req, res) => {
  const userId = req.auth?.sub;
  const roles = req.auth?.realm_access?.roles;
  res.json({ userId, roles });
});
```

## Configuration

```ts
keycloakApiKey({
  serverUrl: 'https://keycloak.example.com',
  realm: 'my-realm',
  clientId: 'my-app',
  clientSecret: process.env.CLIENT_SECRET,
  headerName: 'X-API-Key', // optional, default: X-API-Key
  cacheTtl: 300 // optional, seconds
});
```

### Options

- `serverUrl` (string, required) — Keycloak base URL.
- `realm` (string, required) — Keycloak realm name.
- `clientId` (string, required) — OAuth client ID.
- `clientSecret` (string, optional) — Required for confidential clients.
- `headerName` (string, optional) — API key header (default `X-API-Key`).
- `cacheTtl` (number, optional) — Cache TTL in seconds (default `300`).

## Behavior

- **Missing API key** → `401 Unauthorized`
- **Invalid API key** → `401 Unauthorized`
- **Rate limited** → `429 Too Many Requests` (rate limit headers forwarded)

## TypeScript

The middleware augments `Express.Request` with `auth`:

```ts
interface AuthInfo {
  sub: string;
  azp: string;
  api_key_id: string;
  realm_access?: { roles: string[] };
  scope?: string;
  [key: string]: unknown;
}
```
