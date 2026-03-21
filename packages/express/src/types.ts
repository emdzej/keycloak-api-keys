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
