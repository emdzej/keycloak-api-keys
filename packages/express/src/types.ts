export interface KeycloakApiKeyOptions {
  serverUrl: string;
  realm: string;
  clientId: string;
  clientSecret?: string;
  headerName?: string;
  cacheTtl?: number;
}

export interface AuthInfo {
  sub: string;
  azp: string;
  api_key_id: string;
  realm_access?: { roles: string[] };
  scope?: string;
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthInfo;
    }
  }
}
