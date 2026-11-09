---
title: Node.js
description: Protect Express, Fastify and Hono APIs with Keycloak API keys.
---

Three packages, one behaviour. Each reads the key from a request header, exchanges it at Keycloak's token endpoint, caches the result, and attaches the decoded JWT claims to the request.

| Package | Framework |
|---------|-----------|
| `@emdzej/keycloak-api-keys-express` | Express 4 / 5 |
| `@emdzej/keycloak-api-keys-fastify` | Fastify 5 |
| `@emdzej/keycloak-api-keys-hono` | Hono 4 (Node, Bun, Deno, Cloudflare Workers) |

## Express

```bash
pnpm add @emdzej/keycloak-api-keys-express express
```

```ts
import express from 'express';
import { keycloakApiKey } from '@emdzej/keycloak-api-keys-express';

const app = express();

app.use('/api', keycloakApiKey({
  serverUrl: 'https://auth.example.com',
  realm: 'my-realm',
  clientId: 'my-app',
  clientSecret: process.env.CLIENT_SECRET,
}));

app.get('/api/profile', (req, res) => {
  res.json({
    userId: req.auth?.sub,
    roles: req.auth?.realm_access?.roles,
  });
});
```

Mount the middleware on the paths you want to protect. Anything outside them stays public.

## Fastify

```bash
pnpm add @emdzej/keycloak-api-keys-fastify fastify
```

```ts
import Fastify from 'fastify';
import { keycloakApiKeyPlugin } from '@emdzej/keycloak-api-keys-fastify';

const fastify = Fastify();

await fastify.register(keycloakApiKeyPlugin, {
  serverUrl: 'https://auth.example.com',
  realm: 'my-realm',
  clientId: 'my-app',
  clientSecret: process.env.CLIENT_SECRET,
  prefix: '/api', // routes under this prefix require a key (default: /api)
});

fastify.get('/api/profile', async (request) => ({
  userId: request.auth?.sub,
  roles: request.auth?.realm_access?.roles,
}));
```

## Hono

```bash
pnpm add @emdzej/keycloak-api-keys-hono hono
```

```ts
import { Hono } from 'hono';
import { keycloakApiKey } from '@emdzej/keycloak-api-keys-hono';

const app = new Hono();

app.use('/api/*', keycloakApiKey({
  serverUrl: 'https://auth.example.com',
  realm: 'my-realm',
  clientId: 'my-app',
  clientSecret: process.env.CLIENT_SECRET,
}));

app.get('/api/profile', (c) => {
  const auth = c.get('auth');
  return c.json({ userId: auth.sub });
});
```

The Hono package only uses `fetch`, so it runs anywhere Hono does. Read the secret from whatever your runtime provides: `Bun.env`, `Deno.env.get()`, or the Workers `env` binding.

## Options

All three packages accept the same options.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serverUrl` | `string` | required | Keycloak base URL |
| `realm` | `string` | required | Realm name |
| `clientId` | `string` | required | Client the keys were issued for |
| `clientSecret` | `string` | — | Required for confidential clients, omit for public ones |
| `headerName` | `string` | `X-API-Key` | Header to read the key from |
| `cacheTtl` | `number` | `300` | Max seconds to cache a successful exchange |
| `prefix` | `string` | `/api` | Fastify only: route prefix to protect |

:::note
A key is bound to one client. `clientId` must match the client the key was created for, or the exchange fails with `401`.
:::

## Request auth info

Each package adds an `auth` property (on `req`, `request`, or the Hono context) with the decoded access token:

```ts
interface AuthInfo {
  sub: string;                          // key owner's user ID
  azp: string;                          // client the key is bound to
  api_key_id: string;                   // ID of the key used
  realm_access?: { roles: string[] };   // roles granted to the key
  scope?: string;
  [claim: string]: unknown;             // any other claims your mappers add
}
```

The TypeScript module augmentation is included, so `req.auth` is typed without extra setup.

## Responses

| Situation | Response |
|-----------|----------|
| No key in the header | `401 Unauthorized` |
| Unknown, revoked or expired key, or wrong client | `401 Unauthorized` |
| Rate limit exceeded | `429 Too Many Requests` with Keycloak's `Retry-After` and `X-RateLimit-*` headers forwarded |

## Caching

Successful exchanges are cached in memory per process, keyed by API key. An entry lives for `cacheTtl` seconds or until the access token expires, whichever comes first. A revoked key can therefore keep working for up to `cacheTtl` seconds on an instance that has it cached. Lower `cacheTtl` if you need faster revocation.
