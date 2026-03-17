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

## License

Apache License 2.0
