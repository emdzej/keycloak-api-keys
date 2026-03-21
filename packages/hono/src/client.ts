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

import type { AuthInfo, KeycloakApiKeyOptions } from './types.js';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface TokenExchangeResult {
  token: TokenResponse;
  auth: AuthInfo;
}

export class ApiKeyExchangeError extends Error {
  readonly status: number;
  readonly headers: Headers;

  constructor(message: string, status: number, headers: Headers) {
    super(message);
    this.name = 'ApiKeyExchangeError';
    this.status = status;
    this.headers = headers;
  }
}

export function createTokenExchangeClient(options: KeycloakApiKeyOptions) {
  const tokenUrl = new URL(
    `${options.serverUrl.replace(/\/$/, '')}/realms/${options.realm}/protocol/openid-connect/token`
  ).toString();

  async function exchangeApiKey(apiKey: string): Promise<TokenExchangeResult> {
    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:api-key',
      api_key: apiKey,
      client_id: options.clientId
    });

    if (options.clientSecret) {
      body.set('client_secret', options.clientSecret);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!response.ok) {
      throw new ApiKeyExchangeError('API key exchange failed', response.status, response.headers);
    }

    const token = (await response.json()) as TokenResponse;
    const auth = decodeJwt<AuthInfo>(token.access_token);
    return { token, auth };
  }

  return { exchangeApiKey };
}

function decodeJwt<T>(token: string): T {
  const [, payload] = token.split('.');
  if (!payload) {
    throw new Error('Invalid JWT format');
  }
  const json = decodeBase64Url(payload);
  return JSON.parse(json) as T;
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
