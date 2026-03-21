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

import type { RequestHandler } from 'express';
import type { AuthInfo, KeycloakApiKeyOptions } from './types.js';
import { ApiKeyExchangeError, createTokenExchangeClient } from './client.js';
import { TokenCache } from './cache.js';

const DEFAULT_HEADER = 'X-API-Key';
const DEFAULT_CACHE_TTL = 300;

export function keycloakApiKey(options: KeycloakApiKeyOptions): RequestHandler {
  const headerName = options.headerName ?? DEFAULT_HEADER;
  const cacheTtl = options.cacheTtl ?? DEFAULT_CACHE_TTL;
  const client = createTokenExchangeClient(options);
  const cache = new TokenCache<AuthInfo>();

  return async (req, res, next) => {
    try {
      const apiKey = req.get(headerName);
      if (!apiKey) {
        res.sendStatus(401);
        return;
      }

      const cached = cache.get(apiKey);
      if (cached) {
        req.auth = cached;
        next();
        return;
      }

      const { token, auth } = await client.exchangeApiKey(apiKey);
      const ttl = Math.min(cacheTtl, token.expires_in ?? cacheTtl);
      cache.set(apiKey, auth, ttl);
      req.auth = auth;
      next();
    } catch (error) {
      if (error instanceof ApiKeyExchangeError) {
        if (error.status === 429) {
          forwardRateLimitHeaders(res, error.headers);
          res.sendStatus(429);
          return;
        }
        res.sendStatus(401);
        return;
      }
      next(error);
    }
  };
}

function forwardRateLimitHeaders(res: Parameters<RequestHandler>[1], headers: Headers) {
  const headerNames = [
    'retry-after',
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset'
  ];

  for (const name of headerNames) {
    const value = headers.get(name);
    if (value) {
      res.setHeader(name, value);
    }
  }
}
