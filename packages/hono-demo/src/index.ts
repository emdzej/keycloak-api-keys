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

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { keycloakApiKey } from "@emdzej/keycloak-api-keys-hono";

const app = new Hono();

const auth = keycloakApiKey({
  serverUrl: process.env.KEYCLOAK_URL ?? "http://localhost:8080",
  realm: process.env.KEYCLOAK_REALM ?? "master",
  clientId: process.env.CLIENT_ID ?? "admin-cli",
  clientSecret: process.env.CLIENT_SECRET,
  cacheTtl: 60,
});

// Public route — no auth required
app.get("/health", (c) => {
  return c.json({ status: "ok", middleware: "hono" });
});

// Protected routes
app.use("/api/*", auth);

app.get("/api/profile", (c) => {
  const authInfo = c.get("auth");
  return c.json({
    message: "Hello from Hono!",
    user: {
      sub: authInfo.sub,
      azp: authInfo.azp,
      apiKeyId: authInfo.api_key_id,
      scope: authInfo.scope,
      roles: authInfo.realm_access?.roles ?? [],
    },
  });
});

app.get("/api/data", (c) => {
  return c.json({
    items: [
      { id: 1, name: "Widget A", price: 9.99 },
      { id: 2, name: "Widget B", price: 19.99 },
      { id: 3, name: "Widget C", price: 29.99 },
    ],
  });
});

app.post("/api/echo", async (c) => {
  const body = await c.req.json();
  const authInfo = c.get("auth");
  return c.json({
    received: body,
    authenticatedAs: authInfo.sub,
  });
});

const port = Number(process.env.PORT ?? 3003);
console.log(`Hono demo listening on http://localhost:${port}`);
console.log(`  GET  /health       — public`);
console.log(`  GET  /api/profile  — protected`);
console.log(`  GET  /api/data     — protected`);
console.log(`  POST /api/echo     — protected`);

serve({ fetch: app.fetch, port });
