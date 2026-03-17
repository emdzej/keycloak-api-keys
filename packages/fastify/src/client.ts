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
  const json = Buffer.from(payload, 'base64url').toString('utf8');
  return JSON.parse(json) as T;
}
