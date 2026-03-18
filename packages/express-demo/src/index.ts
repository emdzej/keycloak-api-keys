import express from "express";
import { keycloakApiKey } from "@keycloak-api-keys/express";

const app = express();
app.use(express.json());

const auth = keycloakApiKey({
  serverUrl: process.env.KEYCLOAK_URL ?? "http://localhost:8080",
  realm: process.env.KEYCLOAK_REALM ?? "master",
  clientId: process.env.CLIENT_ID ?? "admin-cli",
  clientSecret: process.env.CLIENT_SECRET,
  cacheTtl: 60,
});

// Public route — no auth required
app.get("/health", (_req, res) => {
  res.json({ status: "ok", middleware: "express" });
});

// Protected routes
app.get("/api/profile", auth, (req, res) => {
  res.json({
    message: "Hello from Express!",
    user: {
      sub: req.auth?.sub,
      azp: req.auth?.azp,
      apiKeyId: req.auth?.api_key_id,
      scope: req.auth?.scope,
      roles: req.auth?.realm_access?.roles ?? [],
    },
  });
});

app.get("/api/data", auth, (_req, res) => {
  res.json({
    items: [
      { id: 1, name: "Widget A", price: 9.99 },
      { id: 2, name: "Widget B", price: 19.99 },
      { id: 3, name: "Widget C", price: 29.99 },
    ],
  });
});

app.post("/api/echo", auth, (req, res) => {
  res.json({
    received: req.body,
    authenticatedAs: req.auth?.sub,
  });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`Express demo listening on http://localhost:${port}`);
  console.log(`  GET  /health       — public`);
  console.log(`  GET  /api/profile  — protected`);
  console.log(`  GET  /api/data     — protected`);
  console.log(`  POST /api/echo     — protected`);
});
