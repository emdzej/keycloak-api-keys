# @keycloak-api-keys/hono

Hono middleware for authenticating requests with Keycloak API keys.

## Installation

```bash
pnpm add @keycloak-api-keys/hono hono
```

## Basic usage

```ts
import { Hono } from 'hono';
import { keycloakApiKey } from '@keycloak-api-keys/hono';

const app = new Hono();

app.use('/api/*', keycloakApiKey({
  realm: 'my-realm',
  serverUrl: 'https://keycloak.example.com',
  clientId: 'my-app',
  clientSecret: process.env.CLIENT_SECRET
}));

app.get('/api/data', (c) => {
  const auth = c.get('auth');
  return c.json({ userId: auth.sub });
});
```

## Cloudflare Workers

```ts
import { Hono } from 'hono';
import { keycloakApiKey } from '@keycloak-api-keys/hono';

const app = new Hono();

app.use('/api/*', keycloakApiKey({
  realm: 'my-realm',
  serverUrl: 'https://keycloak.example.com',
  clientId: 'my-app',
  clientSecret: ENV.CLIENT_SECRET
}));

app.get('/api/hello', (c) => c.json({ ok: true }));

export default app;
```

## Deno

```ts
import { Hono } from 'hono';
import { keycloakApiKey } from '@keycloak-api-keys/hono';

const app = new Hono();

app.use('/api/*', keycloakApiKey({
  realm: 'my-realm',
  serverUrl: 'https://keycloak.example.com',
  clientId: 'my-app',
  clientSecret: Deno.env.get('CLIENT_SECRET')
}));

Deno.serve(app.fetch);
```

## Bun

```ts
import { Hono } from 'hono';
import { keycloakApiKey } from '@keycloak-api-keys/hono';

const app = new Hono();

app.use('/api/*', keycloakApiKey({
  realm: 'my-realm',
  serverUrl: 'https://keycloak.example.com',
  clientId: 'my-app',
  clientSecret: Bun.env.CLIENT_SECRET
}));

Bun.serve({
  fetch: app.fetch
});
```
