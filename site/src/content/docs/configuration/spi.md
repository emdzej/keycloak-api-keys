---
title: SPI Configuration
description: Configure the Keycloak API Keys SPI extension.
---

# SPI Configuration

The API Keys SPI can be configured through Keycloak's standard configuration mechanisms.

## Environment Variables

```bash
# Hash algorithm for storing keys (default: SHA-256)
KC_SPI_API_KEYS_HASH_ALGORITHM=SHA-256

# Key length in characters (default: 64)
KC_SPI_API_KEYS_KEY_LENGTH=64

# Enable/disable audit logging (default: true)
KC_SPI_API_KEYS_AUDIT_ENABLED=true
```

## Keycloak Configuration File

In `keycloak.conf`:

```properties
spi-api-keys-hash-algorithm=SHA-256
spi-api-keys-key-length=64
spi-api-keys-audit-enabled=true
```

## Docker / Kubernetes

```yaml
env:
  - name: KC_SPI_API_KEYS_HASH_ALGORITHM
    value: "SHA-256"
  - name: KC_SPI_API_KEYS_KEY_LENGTH
    value: "64"
  - name: KC_SPI_API_KEYS_AUDIT_ENABLED
    value: "true"
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `hash-algorithm` | `SHA-256` | Algorithm used to hash API keys before storage |
| `key-length` | `64` | Length of the random portion of generated keys |
| `audit-enabled` | `true` | Whether to emit Keycloak events for key operations |

## Security Recommendations

### Production Settings

```properties
# Use strong hashing
spi-api-keys-hash-algorithm=SHA-256

# Use sufficient key length (minimum 32, recommended 64)
spi-api-keys-key-length=64

# Always enable audit in production
spi-api-keys-audit-enabled=true
```

### Key Storage

API keys are stored as one-way hashes. The original key cannot be recovered from the database. This means:

- If a user loses their key, they must create a new one
- Keys cannot be "shown" again after creation
- Database compromise doesn't expose usable keys

## Next Steps

- [Client Settings](/keycloak-api-keys/configuration/client/) — Per-client configuration
- [Key Prefixes](/keycloak-api-keys/configuration/prefixes/) — Configure client prefixes
