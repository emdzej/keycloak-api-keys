import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import type { AuthInfo, KeycloakApiKeyOptions } from './types.js';
import { ApiKeyExchangeError, createTokenExchangeClient } from './client.js';
import { TokenCache } from './cache.js';

const DEFAULT_HEADER = 'X-API-Key';
const DEFAULT_CACHE_TTL = 300;

export function keycloakApiKey(options: KeycloakApiKeyOptions) {
  const headerName = options.headerName ?? DEFAULT_HEADER;
  const cacheTtl = options.cacheTtl ?? DEFAULT_CACHE_TTL;
  const client = createTokenExchangeClient(options);
  const cache = new TokenCache<AuthInfo>();

  return createMiddleware(async (c, next) => {
    const apiKey = c.req.header(headerName);
    if (!apiKey) {
      return c.json({ error: 'unauthorized', message: 'API key required' }, 401);
    }

    const cached = cache.get(apiKey);
    if (cached) {
      c.set('auth', cached);
      await next();
      return;
    }

    try {
      const { token, auth } = await client.exchangeApiKey(apiKey);
      const ttl = Math.min(cacheTtl, token.expires_in ?? cacheTtl);
      cache.set(apiKey, auth, ttl);
      c.set('auth', auth);
      await next();
    } catch (error) {
      if (error instanceof ApiKeyExchangeError) {
        if (error.status === 429) {
          forwardRateLimitHeaders(c, error.headers);
          return c.json(
            { error: 'rate_limit_exceeded', message: 'API key rate limit exceeded' },
            429
          );
        }
        return c.json({ error: 'unauthorized', message: 'Invalid API key' }, 401);
      }
      throw error;
    }
  });
}

function forwardRateLimitHeaders(c: Context, headers: Headers) {
  const headerNames = [
    'retry-after',
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset'
  ];

  for (const name of headerNames) {
    const value = headers.get(name);
    if (value) {
      c.header(name, value);
    }
  }
}
