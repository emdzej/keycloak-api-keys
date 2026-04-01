---
title: Node.js / Express
description: Integrate Keycloak API Keys with Node.js and Express applications.
---

# Node.js / Express

The Node.js package provides middleware for Express and compatible frameworks.

## Installation

```bash
npm install @emdzej/keycloak-api-keys-node
# or
pnpm add @emdzej/keycloak-api-keys-node
```

## Basic Usage

```typescript
import express from 'express';
import { apiKeyAuth } from '@emdzej/keycloak-api-keys-node';

const app = express();

app.use(apiKeyAuth({
  keycloakUrl: 'https://auth.example.com',
  realm: 'my-realm',
  clientId: 'my-api',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
}));

app.get('/api/data', (req, res) => {
  // req.apiKey is available after authentication
  console.log('Key ID:', req.apiKey.id);
  console.log('Key Name:', req.apiKey.name);
  console.log('Client:', req.apiKey.clientId);
  console.log('Scopes:', req.apiKey.scopes);
  
  res.json({ message: 'Authenticated!' });
});

app.listen(3000);
```

## Configuration Options

```typescript
interface ApiKeyAuthOptions {
  // Required
  keycloakUrl: string;      // Keycloak base URL
  realm: string;            // Realm name
  clientId: string;         // Client ID for introspection
  clientSecret: string;     // Client secret
  
  // Optional
  headerName?: string;      // Default: 'X-API-Key'
  cacheTtl?: number;        // Cache TTL in ms (default: 60000)
  onError?: ErrorHandler;   // Custom error handler
}
```

## Selective Protection

Protect only specific routes:

```typescript
import { apiKeyAuth, requireApiKey } from '@emdzej/keycloak-api-keys-node';

const app = express();

// Configure middleware (doesn't protect anything yet)
const auth = apiKeyAuth({
  keycloakUrl: 'https://auth.example.com',
  realm: 'my-realm',
  clientId: 'my-api',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
});

// Public route
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Protected routes
app.use('/api', auth, requireApiKey());

app.get('/api/data', (req, res) => {
  res.json({ data: 'protected' });
});
```

## Scope Validation

```typescript
import { apiKeyAuth, requireScopes } from '@emdzej/keycloak-api-keys-node';

app.use('/api', apiKeyAuth({ /* ... */ }));

// Require specific scopes
app.get('/api/read', requireScopes('read'), (req, res) => {
  res.json({ data: 'read-only data' });
});

app.post('/api/write', requireScopes('write'), (req, res) => {
  res.json({ message: 'written' });
});

// Require multiple scopes
app.delete('/api/admin', requireScopes('admin', 'write'), (req, res) => {
  res.json({ message: 'admin action' });
});
```

## Custom Error Handling

```typescript
app.use(apiKeyAuth({
  keycloakUrl: 'https://auth.example.com',
  realm: 'my-realm',
  clientId: 'my-api',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
  onError: (err, req, res) => {
    if (err.code === 'INVALID_KEY') {
      return res.status(401).json({ 
        error: 'Invalid API key',
        hint: 'Check that your key is correct and not revoked'
      });
    }
    if (err.code === 'MISSING_KEY') {
      return res.status(401).json({ 
        error: 'API key required',
        hint: 'Include X-API-Key header'
      });
    }
    // Default handling
    res.status(500).json({ error: 'Internal error' });
  }
}));
```

## TypeScript Types

```typescript
// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        name: string;
        clientId: string;
        scopes: string[];
        active: boolean;
      };
    }
  }
}
```

## With Fastify

```typescript
import Fastify from 'fastify';
import { fastifyApiKeyAuth } from '@emdzej/keycloak-api-keys-node/fastify';

const app = Fastify();

app.register(fastifyApiKeyAuth, {
  keycloakUrl: 'https://auth.example.com',
  realm: 'my-realm',
  clientId: 'my-api',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
});

app.get('/api/data', async (request, reply) => {
  return { keyId: request.apiKey.id };
});
```

## Caching

By default, introspection results are cached for 60 seconds:

```typescript
app.use(apiKeyAuth({
  // ...
  cacheTtl: 300000, // 5 minutes
}));
```

Set to `0` to disable caching (not recommended for production).

## Next Steps

- [Java Middleware](/keycloak-api-keys/middleware/java/) — Spring Boot integration
- [.NET Middleware](/keycloak-api-keys/middleware/dotnet/) — ASP.NET Core integration
