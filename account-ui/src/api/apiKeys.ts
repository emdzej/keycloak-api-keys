import type {
  ApiKeyListResponse,
  CreateApiKeyRequest,
  CreateApiKeyResponse
} from "../types";

const getRealm = () => {
  const path = window.location.pathname;
  const realmMatch = path.match(/\/realms\/([^/]+)/);
  if (realmMatch?.[1]) {
    return realmMatch[1];
  }
  const maybeRealm = (window as { kcContext?: { realm?: string } }).kcContext
    ?.realm;
  return maybeRealm ?? "";
};

const getToken = () => {
  const windowAny = window as {
    keycloak?: { token?: string };
    kcContext?: { token?: string };
  };
  return windowAny.keycloak?.token ?? windowAny.kcContext?.token;
};

const apiBase = () => {
  const realm = getRealm();
  return `${window.location.origin}/realms/${realm}/account/api-keys`;
};

const withAuth = (init?: RequestInit): RequestInit => {
  const token = getToken();
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(init?.headers ?? {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    credentials: "include",
    ...init,
    headers
  };
};

export const listApiKeys = async (): Promise<ApiKeyListResponse> => {
  const response = await fetch(apiBase(), withAuth());
  if (!response.ok) {
    throw new Error(`Failed to load API keys (${response.status})`);
  }
  return (await response.json()) as ApiKeyListResponse;
};

export const createApiKey = async (
  payload: CreateApiKeyRequest
): Promise<CreateApiKeyResponse> => {
  const response = await fetch(
    apiBase(),
    withAuth({
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to create API key (${response.status})`);
  }

  return (await response.json()) as CreateApiKeyResponse;
};

export const revokeApiKey = async (id: string): Promise<void> => {
  const response = await fetch(
    `${apiBase()}/${id}`,
    withAuth({
      method: "DELETE"
    })
  );

  if (!response.ok && response.status !== 204) {
    const message = await response.text();
    throw new Error(message || `Failed to revoke API key (${response.status})`);
  }
};
