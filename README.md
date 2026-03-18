# keycloak-api-keys

Keycloak extension for API key management — generate, validate, and exchange API keys for JWT tokens.

## Overview

This project extends Keycloak with API key capabilities, allowing users to generate API keys that can be exchanged for JWT tokens. API keys are scoped to specific clients and can have granular permissions.

## Components

| Module | Description |
|--------|-------------|
| `keycloak-api-keys-spi` | Keycloak server extension (storage, REST API, token exchange) |
| `keycloak-api-keys-account-ui` | Account Console UI extension for user self-service |
| `keycloak-api-keys-admin-ui` | Admin Console UI extension for administrators |
| `keycloak-api-keys-spring` | Spring Security integration |
| `keycloak-api-keys-express` | Express.js middleware |
| `keycloak-api-keys-fastify` | Fastify plugin |
| `keycloak-api-keys-hono` | Hono middleware (edge-ready) |
| `express-demo` | Demo app — Express.js (port 3001) |
| `fastify-demo` | Demo app — Fastify (port 3002) |
| `hono-demo` | Demo app — Hono (port 3003) |
| `spring-demo` | Demo app — Spring Boot (port 3004) |

## Documentation

- [Specification](docs/SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)

## Status

✅ **Design Complete** — ready for implementation

## Local Development

### Prerequisites
- Java 21
- Node.js 22+
- pnpm
- Docker & Docker Compose

### Quick Start

```bash
# Install dependencies
pnpm install

# Build and run Keycloak with extensions
./scripts/dev.sh

# Or build only
./scripts/build.sh
```

Keycloak will be available at http://localhost:8080
- Admin Console: http://localhost:8080/admin
- Account Console: http://localhost:8080/realms/master/account
- Credentials: admin / admin

### Development Workflow

1. Make changes to SPI code (spi/src/...)
2. Run `./scripts/build.sh`
3. Restart Keycloak: `docker compose -f docker-compose.dev.yml restart keycloak`

For UI changes, the build output goes directly to theme resources, so just rebuild and refresh the browser.

## Demo Applications

Each middleware package has a companion demo app that shows a working API protected by API key authentication. All demos expose the same four endpoints:

| Route | Auth | Description |
|-------|------|-------------|
| `GET /health` | Public | Liveness check |
| `GET /api/profile` | Required | Returns JWT claims from the exchanged token |
| `GET /api/data` | Required | Returns a sample item list |
| `POST /api/echo` | Required | Echoes the request body |

### Prerequisites

Keycloak must be running locally with the SPI installed:

```bash
docker compose up -d
```

Then create an API key via the Account Console (`http://localhost:8080/realms/master/account`) or via the REST API:

```bash
# Get a token first
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli&grant_type=password&username=admin&password=admin" \
  | jq -r .access_token)

# Create an API key
curl -s -X POST http://localhost:8080/realms/master/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-demo-key", "clientId": "admin-cli"}'
```

Save the returned `key` value — you'll use it as the `X-API-Key` header.

### Running the demos

All demos read configuration from environment variables. The defaults point to `http://localhost:8080` / realm `master` / client `admin-cli` so they work out of the box with the local Docker setup.

**Express** (port 3001):
```bash
pnpm --filter @keycloak-api-keys/express-demo dev
```

**Fastify** (port 3002):
```bash
pnpm --filter @keycloak-api-keys/fastify-demo dev
```

**Hono** (port 3003):
```bash
pnpm --filter @keycloak-api-keys/hono-demo dev
```

**Spring Boot** (port 3004):
```bash
./gradlew :packages:spring-demo:bootRun
```

To override the Keycloak connection for any Node.js demo:
```bash
KEYCLOAK_URL=https://keycloak.example.com \
KEYCLOAK_REALM=myrealm \
CLIENT_ID=myclient \
pnpm --filter @keycloak-api-keys/express-demo dev
```

For Spring Boot, edit `packages/spring-demo/src/main/resources/application.properties`.

### Testing a protected endpoint

Once a demo is running, call a protected route with your API key:

```bash
# Public route — no key needed
curl http://localhost:3001/health

# Protected route — API key required
curl http://localhost:3001/api/profile \
  -H "X-API-Key: <your-api-key>"

# POST with a body
curl -X POST http://localhost:3001/api/echo \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"hello": "world"}'
```

Replace `3001` with `3002` (Fastify), `3003` (Hono), or `3004` (Spring Boot) as needed. The response from `/api/profile` shows the claims from the exchanged token, including `apiKeyId`, `sub`, and the roles restricted to what the key was granted.

### Environment variables (Node.js demos)

| Variable | Default | Description |
|----------|---------|-------------|
| `KEYCLOAK_URL` | `http://localhost:8080` | Keycloak base URL |
| `KEYCLOAK_REALM` | `master` | Realm name |
| `CLIENT_ID` | `admin-cli` | OAuth2 client ID |
| `CLIENT_SECRET` | — | Client secret (omit for public clients) |
| `PORT` | `3001` / `3002` / `3003` | HTTP port |

## License

Apache License 2.0
