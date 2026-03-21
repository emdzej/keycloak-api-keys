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
  const env = getEnvironment();
  return env?.realm ?? "";
};

// Read the environment JSON embedded in the page by Keycloak
const getEnvironment = (): { realm?: string; serverBaseUrl?: string } | null => {
  try {
    const el = document.getElementById("environment");
    return el ? JSON.parse(el.textContent ?? "{}") : null;
  } catch {
    return null;
  }
};

const apiBase = () => {
  const realm = getRealm();
  return `${window.location.origin}/realms/${realm}/api-keys`;
};

const withAuth = (getToken: () => Promise<string>, init?: RequestInit): Promise<RequestInit> =>
  getToken().then((token) => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init?.headers as Record<string, string> ?? {})
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return {
      credentials: "include" as RequestCredentials,
      ...init,
      headers
    };
  });

export const listApiKeys = async (getToken: () => Promise<string>): Promise<ApiKeyListResponse> => {
  const response = await fetch(apiBase(), await withAuth(getToken));
  if (!response.ok) {
    throw new Error(`Failed to load API keys (${response.status})`);
  }
  const data = await response.json();
  const keys = Array.isArray(data) ? data : (data.keys ?? []);
  return { keys };
};

export const createApiKey = async (
  getToken: () => Promise<string>,
  payload: CreateApiKeyRequest
): Promise<CreateApiKeyResponse> => {
  const response = await fetch(
    apiBase(),
    await withAuth(getToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
  );
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to create API key (${response.status})`);
  }
  return (await response.json()) as CreateApiKeyResponse;
};

export const revokeApiKey = async (
  getToken: () => Promise<string>,
  id: string
): Promise<void> => {
  const response = await fetch(
    `${apiBase()}/${id}`,
    await withAuth(getToken, { method: "DELETE" })
  );
  if (!response.ok && response.status !== 204) {
    const message = await response.text();
    throw new Error(message || `Failed to revoke API key (${response.status})`);
  }
};
