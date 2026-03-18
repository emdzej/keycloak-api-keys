import type { FastifyInstance, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { AuthInfo, KeycloakApiKeyOptions } from './types.js';
import { ApiKeyExchangeError, createTokenExchangeClient } from './client.js';
import { TokenCache } from './cache.js';

const DEFAULT_HEADER = 'X-API-Key';
const DEFAULT_CACHE_TTL = 300;
const DEFAULT_PREFIX = '/api';

function getHeaderValue(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  const value = headers[name];
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function shouldProtectRoute(url: string, prefix: string): boolean {
  if (!prefix || prefix === '/') {
    return true;
  }
  const normalized = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  return url === normalized || url.startsWith(`${normalized}/`);
}

async function keycloakApiKeyPluginImpl(
  fastify: FastifyInstance,
  options: KeycloakApiKeyOptions
) {
  const headerName = (options.headerName ?? DEFAULT_HEADER).toLowerCase();
  const cacheTtl = options.cacheTtl ?? DEFAULT_CACHE_TTL;
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const client = createTokenExchangeClient(options);
  const cache = new TokenCache<AuthInfo>();

  fastify.decorateRequest('auth', undefined as AuthInfo | undefined);

  fastify.addHook('preHandler', async (request, reply) => {
    // Strip query string before prefix check
    const pathname = request.url.split('?')[0] ?? request.url;
    if (!shouldProtectRoute(pathname, prefix)) {
      return;
    }

    try {
      const apiKey = getHeaderValue(request.headers, headerName);
      if (!apiKey) {
        await reply.status(401).send();
        return;
      }

      const cached = cache.get(apiKey);
      if (cached) {
        request.auth = cached;
        return;
      }

      const { token, auth } = await client.exchangeApiKey(apiKey);
      const ttl = Math.min(cacheTtl, token.expires_in ?? cacheTtl);
      cache.set(apiKey, auth, ttl);
      request.auth = auth;
    } catch (error) {
      if (error instanceof ApiKeyExchangeError) {
        if (error.status === 429) {
          forwardRateLimitHeaders(reply, error.headers);
          await reply.status(429).send();
          return;
        }
        await reply.status(401).send();
        return;
      }
      throw error;
    }
  });
}

function forwardRateLimitHeaders(reply: FastifyReply, headers: Headers) {
  const headerNames = [
    'retry-after',
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset'
  ];

  for (const name of headerNames) {
    const value = headers.get(name);
    if (value) {
      reply.header(name, value);
    }
  }
}

export const keycloakApiKeyPlugin = fp(keycloakApiKeyPluginImpl, {
  name: '@emdzej/keycloak-api-keys-fastify',
  fastify: '5.x'
});
