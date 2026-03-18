# @emdzej/keycloak-api-keys-fastify

Fastify plugin for validating Keycloak API keys and attaching decoded auth info to the request.

## Installation

```bash
pnpm add @emdzej/keycloak-api-keys-fastify fastify
```

## Usage

```ts
import Fastify from 'fastify';
import { keycloakApiKeyPlugin } from '@emdzej/keycloak-api-keys-fastify';

const fastify = Fastify();

await fastify.register(keycloakApiKeyPlugin, {
  realm: 'my-realm',
  serverUrl: 'https://keycloak.example.com',
  clientId: 'my-app',
  clientSecret: process.env.CLIENT_SECRET
});

fastify.get('/api/data', async (request) => {
  const userId = request.auth?.sub;
  const roles = request.auth?.realm_access?.roles;
  return { userId, roles };
});
```

## Configuration

```ts
await fastify.register(keycloakApiKeyPlugin, {
  serverUrl: 'https://keycloak.example.com',
  realm: 'my-realm',
  clientId: 'my-app',
  clientSecret: process.env.CLIENT_SECRET,
  headerName: 'X-API-Key', // optional, default: X-API-Key
  cacheTtl: 300, // optional, seconds
  prefix: '/api' // optional, route prefix to protect
});
```

### Options

- `serverUrl` (string, required) — Keycloak base URL.
- `realm` (string, required) — Keycloak realm name.
- `clientId` (string, required) — OAuth client ID.
- `clientSecret` (string, optional) — Required for confidential clients.
- `headerName` (string, optional) — API key header (default `X-API-Key`).
- `cacheTtl` (number, optional) — Cache TTL in seconds (default `300`).
- `prefix` (string, optional) — Route prefix to protect (default `/api`).

## Behavior

- **Missing API key** → `401 Unauthorized`
- **Invalid API key** → `401 Unauthorized`
- **Rate limited** → `429 Too Many Requests` (rate limit headers forwarded)

## TypeScript

The plugin augments `FastifyRequest` with `auth`:

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
