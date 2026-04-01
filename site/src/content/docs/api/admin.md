---
title: Admin API
description: API reference for managing API keys.
---

# Admin API

The Admin API allows you to manage API keys programmatically.

## Authentication

All Admin API endpoints require a valid admin access token:

```bash
# Get admin token
TOKEN=$(curl -s -X POST \
  "https://auth.example.com/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | jq -r '.access_token')

# Use in requests
curl -H "Authorization: Bearer $TOKEN" ...
```

## Endpoints

### List API Keys

```http
GET /admin/realms/{realm}/clients/{clientId}/api-keys
```

**Response:**
```json
{
  "keys": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Production Key",
      "prefix": "myapp",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastUsedAt": "2024-01-20T15:45:00Z",
      "expiresAt": null
    }
  ],
  "total": 1
}
```

---

### Create API Key

```http
POST /admin/realms/{realm}/clients/{clientId}/api-keys
Content-Type: application/json

{
  "name": "My New Key",
  "expiresAt": "2025-01-01T00:00:00Z"  // optional
}
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "My New Key",
  "prefix": "myapp",
  "key": "myapp_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
  "createdAt": "2024-01-21T12:00:00Z",
  "expiresAt": "2025-01-01T00:00:00Z"
}
```

:::caution
The `key` field is only returned on creation. Store it securely — it cannot be retrieved later.
:::

---

### Get API Key

```http
GET /admin/realms/{realm}/clients/{clientId}/api-keys/{keyId}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Production Key",
  "prefix": "myapp",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastUsedAt": "2024-01-20T15:45:00Z",
  "expiresAt": null,
  "usageCount": 1523
}
```

---

### Update API Key

```http
PUT /admin/realms/{realm}/clients/{clientId}/api-keys/{keyId}
Content-Type: application/json

{
  "name": "Updated Key Name"
}
```

---

### Revoke API Key

```http
DELETE /admin/realms/{realm}/clients/{clientId}/api-keys/{keyId}
```

**Response:** `204 No Content`

---

## Token Introspection

Validate API keys using standard OAuth2 introspection:

```http
POST /realms/{realm}/protocol/openid-connect/token/introspect
Content-Type: application/x-www-form-urlencoded

client_id=my-api&
client_secret=secret&
token=myapp_a1b2c3d4...
```

**Response (valid key):**
```json
{
  "active": true,
  "client_id": "my-api",
  "token_type": "api_key",
  "scope": "openid profile email",
  "api_key_id": "550e8400-e29b-41d4-a716-446655440000",
  "api_key_name": "Production Key",
  "iat": 1705312200,
  "exp": null
}
```

**Response (invalid/revoked key):**
```json
{
  "active": false
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "invalid_request",
  "error_description": "Key name is required"
}
```

### 401 Unauthorized

```json
{
  "error": "unauthorized",
  "error_description": "Invalid admin token"
}
```

### 404 Not Found

```json
{
  "error": "not_found",
  "error_description": "API key not found"
}
```

### 409 Conflict

```json
{
  "error": "conflict",
  "error_description": "Maximum number of keys reached"
}
```

## Rate Limiting

The Admin API is rate-limited to prevent abuse:

| Endpoint | Limit |
|----------|-------|
| Create key | 10/minute |
| List keys | 60/minute |
| Other | 120/minute |

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705312260
```
