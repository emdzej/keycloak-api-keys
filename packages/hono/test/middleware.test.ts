import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keycloakApiKey } from '../src/middleware.js';

const KEYCLOAK_URL = 'https://kc.example.com';

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createJwt(payload: Record<string, unknown>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${header}.${body}.`;
}

function createApp() {
  const app = new Hono();

  app.use(
    '/api/*',
    keycloakApiKey({
      serverUrl: KEYCLOAK_URL,
      realm: 'test',
      clientId: 'app',
      clientSecret: 'secret'
    })
  );

  app.get('/api/data', (c) => {
    return c.json({ sub: c.get('auth').sub });
  });

  app.get('/public', (c) => {
    return c.json({ ok: true });
  });

  return app;
}

let originalFetch: typeof fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = originalFetch;
});

describe('keycloakApiKey', () => {
  it('returns 401 when api key missing', async () => {
    const app = createApp();
    const response = await app.request('/api/data');

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string; message: string };
    expect(body.error).toBe('unauthorized');
  });

  it('returns 401 when keycloak rejects api key', async () => {
    const app = createApp();

    vi.stubGlobal('fetch', vi.fn(async (input) => {
      if (typeof input === 'string' && input.startsWith(KEYCLOAK_URL)) {
        return new Response(JSON.stringify({ error: 'invalid' }), {
          status: 401,
          headers: { 'content-type': 'application/json' }
        });
      }
      return originalFetch(input);
    }));

    const response = await app.request('/api/data', {
      headers: { 'X-API-Key': 'bad-key' }
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string; message: string };
    expect(body.message).toBe('Invalid API key');
  });

  it('forwards rate limit headers on 429', async () => {
    const app = createApp();

    vi.stubGlobal('fetch', vi.fn(async (input) => {
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
      return originalFetch(input);
    }));

    const response = await app.request('/api/data', {
      headers: { 'X-API-Key': 'rate-limited' }
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('10');
    expect(response.headers.get('x-ratelimit-limit')).toBe('60');
  });

  it('attaches auth info on success', async () => {
    const app = createApp();
    const jwt = createJwt({ sub: 'user-1', azp: 'app', api_key_id: 'key-123' });

    vi.stubGlobal('fetch', vi.fn(async (input) => {
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
      return originalFetch(input);
    }));

    const response = await app.request('/api/data', {
      headers: { 'X-API-Key': 'good-key' }
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { sub: string };
    expect(body.sub).toBe('user-1');
  });

  it('skips auth for routes outside middleware scope', async () => {
    const app = createApp();

    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('Fetch should not be called');
    }));

    const response = await app.request('/public');
    expect(response.status).toBe(200);
  });
});
