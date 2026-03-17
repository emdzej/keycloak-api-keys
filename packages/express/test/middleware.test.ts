import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keycloakApiKey } from '../src/middleware.js';

const KEYCLOAK_URL = 'https://kc.example.com';

function createJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' }), 'utf8').toString(
    'base64url'
  );
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${header}.${body}.`;
}

async function startServer() {
  const app = express();
  app.use(
    keycloakApiKey({
      serverUrl: KEYCLOAK_URL,
      realm: 'test',
      clientId: 'app',
      clientSecret: 'secret'
    })
  );
  app.get('/data', (req, res) => {
    res.json({ sub: req.auth?.sub });
  });

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unexpected server address');
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve()))
  };
}

let originalFetch: typeof fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = originalFetch;
});

describe('keycloakApiKey middleware', () => {
  it('returns 401 when api key missing', async () => {
    const server = await startServer();

    const response = await fetch(`${server.url}/data`);
    expect(response.status).toBe(401);

    await server.close();
  });

  it('returns 401 when keycloak rejects api key', async () => {
    const server = await startServer();

    vi.stubGlobal('fetch', vi.fn(async (input, init) => {
      if (typeof input === 'string' && input.startsWith(KEYCLOAK_URL)) {
        return new Response(JSON.stringify({ error: 'invalid' }), {
          status: 401,
          headers: { 'content-type': 'application/json' }
        });
      }
      return originalFetch(input, init);
    }));

    const response = await fetch(`${server.url}/data`, {
      headers: { 'X-API-Key': 'bad-key' }
    });

    expect(response.status).toBe(401);
    await server.close();
  });

  it('forwards rate limit headers on 429', async () => {
    const server = await startServer();

    vi.stubGlobal('fetch', vi.fn(async (input, init) => {
      if (typeof input === 'string' && input.startsWith(KEYCLOAK_URL)) {
        return new Response(JSON.stringify({ error: 'rate_limited' }), {
          status: 429,
          headers: {
            'retry-after': '10',
            'x-ratelimit-limit': '60',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1710687600',
            'content-type': 'application/json'
          }
        });
      }
      return originalFetch(input, init);
    }));

    const response = await fetch(`${server.url}/data`, {
      headers: { 'X-API-Key': 'rate-limited' }
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('10');
    expect(response.headers.get('x-ratelimit-limit')).toBe('60');

    await server.close();
  });

  it('attaches auth info on success', async () => {
    const server = await startServer();
    const jwt = createJwt({ sub: 'user-1', azp: 'app', api_key_id: 'key-123' });

    vi.stubGlobal('fetch', vi.fn(async (input, init) => {
      if (typeof input === 'string' && input.startsWith(KEYCLOAK_URL)) {
        return new Response(
          JSON.stringify({
            access_token: jwt,
            token_type: 'Bearer',
            expires_in: 300
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' }
          }
        );
      }
      return originalFetch(input, init);
    }));

    const response = await fetch(`${server.url}/data`, {
      headers: { 'X-API-Key': 'good-key' }
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { sub: string };
    expect(body.sub).toBe('user-1');

    await server.close();
  });
});
