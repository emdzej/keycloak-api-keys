/*
 * Copyright (c) 2026 Michał Jaskólski and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keycloakApiKeyPlugin } from '../src/plugin.js';

const KEYCLOAK_URL = 'https://kc.example.com';

function createJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' }), 'utf8').toString(
    'base64url'
  );
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${header}.${body}.`;
}

async function createServer() {
  const fastify = Fastify();

  await fastify.register(keycloakApiKeyPlugin, {
    serverUrl: KEYCLOAK_URL,
    realm: 'test',
    clientId: 'app',
    clientSecret: 'secret'
  });

  fastify.get('/api/data', async (request) => {
    return { sub: request.auth?.sub };
  });

  fastify.get('/public', async () => {
    return { ok: true };
  });

  await fastify.ready();

  return fastify;
}

async function startServer() {
  const fastify = await createServer();
  await fastify.listen({ port: 0, host: '127.0.0.1' });

  const address = fastify.server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unexpected server address');
  }

  return {
    fastify,
    url: `http://127.0.0.1:${address.port}`,
    close: () => fastify.close()
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

describe('keycloakApiKeyPlugin', () => {
  it('returns 401 when api key missing', async () => {
    const server = await startServer();

    const response = await fetch(`${server.url}/api/data`);
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

    const response = await fetch(`${server.url}/api/data`, {
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

    const response = await fetch(`${server.url}/api/data`, {
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

    const response = await fetch(`${server.url}/api/data`, {
      headers: { 'X-API-Key': 'good-key' }
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { sub: string };
    expect(body.sub).toBe('user-1');

    await server.close();
  });

  it('skips auth for routes outside prefix', async () => {
    const server = await startServer();

    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('Fetch should not be called');
    }));

    // Use fastify.inject so we don't use the global fetch that's been stubbed
    const response = await server.fastify.inject({ method: 'GET', url: '/public' });
    expect(response.statusCode).toBe(200);

    await server.close();
  });
});
