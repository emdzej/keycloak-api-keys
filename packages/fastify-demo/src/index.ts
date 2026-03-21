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

import Fastify from "fastify";
import { keycloakApiKeyPlugin } from "@emdzej/keycloak-api-keys-fastify";

const server = Fastify({ logger: true });

await server.register(keycloakApiKeyPlugin, {
  serverUrl: process.env.KEYCLOAK_URL ?? "http://localhost:8080",
  realm: process.env.KEYCLOAK_REALM ?? "master",
  clientId: process.env.CLIENT_ID ?? "admin-cli",
  clientSecret: process.env.CLIENT_SECRET,
  prefix: "/api",
  cacheTtl: 60,
});

// Public route — no auth required
server.get("/health", async () => {
  return { status: "ok", middleware: "fastify" };
});

// Protected routes (under /api prefix)
server.get("/api/profile", async (request) => {
  return {
    message: "Hello from Fastify!",
    user: {
      sub: request.auth?.sub,
      azp: request.auth?.azp,
      apiKeyId: request.auth?.api_key_id,
      scope: request.auth?.scope,
      roles: request.auth?.realm_access?.roles ?? [],
    },
  };
});

server.get("/api/data", async () => {
  return {
    items: [
      { id: 1, name: "Widget A", price: 9.99 },
      { id: 2, name: "Widget B", price: 19.99 },
      { id: 3, name: "Widget C", price: 29.99 },
    ],
  };
});

server.post("/api/echo", async (request) => {
  return {
    received: request.body,
    authenticatedAs: request.auth?.sub,
  };
});

const port = Number(process.env.PORT ?? 3002);
await server.listen({ port, host: "0.0.0.0" });
console.log(`Fastify demo listening on http://localhost:${port}`);
console.log(`  GET  /health       — public`);
console.log(`  GET  /api/profile  — protected`);
console.log(`  GET  /api/data     — protected`);
console.log(`  POST /api/echo     — protected`);
