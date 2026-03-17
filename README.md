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
| `keycloak-api-keys-hono` | Hono middleware (edge-ready) |

## Documentation

- [Specification](docs/SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)

## Status

🟡 **Design Phase** — specification in progress

## License

Apache License 2.0
