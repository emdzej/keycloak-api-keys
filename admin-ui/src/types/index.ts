export type ApiKeyStatus = "active" | "revoked" | "expired";

export type AdminApiKey = {
  id: string;
  name: string;
  keyPrefix?: string;
  userId: string;
  clientId: string;
  roles?: string[];
  scopes?: string[];
  expiresAt?: string | null;
  revokedAt?: string | null;
  lastUsedAt?: string | null;
  lastUsedIp?: string | null;
  usageCount?: number | null;
  createdAt?: string | null;
};

export type ApiKeyListResponse = {
  keys: AdminApiKey[];
};

export type ApiKeyStats = {
  usageCount: number;
  lastUsedAt?: string | null;
  lastUsedIp?: string | null;
};

export type CreateApiKeyRequest = {
  name: string;
  clientId: string;
  expiresAt?: string | null;
};

export type CreateApiKeyResponse = AdminApiKey & {
  key: string;
};

export type ApiKeyFiltersState = {
  userId: string;
  clientId: string;
  status: ApiKeyStatus | "";
};
