export type ApiKey = {
  id: string;
  name: string;
  keyPrefix?: string;
  clientId: string;
  roles?: string[];
  scopes?: string[];
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  usageCount?: number | null;
  createdAt?: string | null;
};

export type ApiKeyListResponse = {
  keys: ApiKey[];
};

export type CreateApiKeyRequest = {
  name: string;
  clientId: string;
  roles?: string[];
  scopes?: string[];
  expiresAt?: string | null;
};

export type CreateApiKeyResponse = ApiKey & {
  key: string;
};
