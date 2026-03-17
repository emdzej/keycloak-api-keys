## Summary
Implemented Admin REST API endpoints for Keycloak API Keys extension.

- Added `AdminApiKeyResource`, `AdminApiKeyResourceProvider`, and factory.
- Added `AdminAuth` helper for role-based authorization (`view-api-keys`, `manage-api-keys`).
- Extended `ApiKeyService` with `findByRealm` (filtering), `findById`, `createForUser`, `getStats`, `revokeKey`.
- Added DTOs `AdminApiKeyResponse` (includes `userId`) and `ApiKeyStatsResponse`.
- Registered `RealmResourceProvider` with ID `api-keys`.

Endpoints implemented:
- `GET /realms/{realm}/api-keys`: List keys with filters (userId, clientId, status).
- `GET /realms/{realm}/api-keys/{keyId}/stats`: Get key statistics.
- `POST /realms/{realm}/api-keys/users/{userId}`: Create key for specific user.
- `DELETE /realms/{realm}/api-keys/{keyId}`: Revoke key.

Note: The endpoints are mounted under `/realms/{realm}/api-keys` due to `RealmResourceProvider` mechanism. The Admin functionality is secured via role checks.
