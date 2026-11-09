---
title: Installation
description: How to install the Keycloak API Keys SPI extension.
---

# Installation

## Requirements

- Keycloak 26.7 or later (tested with 26.8.2)
- Java 21 or later (for building from source)

## Version Compatibility

| SPI version | Keycloak | Notes |
|-------------|----------|-------|
| `0.2.x` | 26.7 and later (built against 26.8.2) | Recommended. Uses Keycloak APIs introduced in 26.7. |
| `0.1.1` | 26.5 – 26.6.x | Use this on Keycloak older than 26.7. Also works on 26.6.4+. |
| `0.1.0` | 26.5 – 26.6.3 | ⚠️ Fails on 26.6.4+ (token exchange returns HTTP 500). Upgrade to `0.1.1`. |

The middleware packages (Spring, Express, Fastify, Hono, ASP.NET Core) talk to Keycloak only over HTTP
(the standard token endpoint), so they are independent of the Keycloak version and work with any SPI version above.

## Option 1: Download JAR

Download the latest release from [GitHub Releases](https://github.com/emdzej/keycloak-api-keys/releases):

```bash
# Download the JAR
curl -L -o keycloak-api-keys-spi.jar \
  https://github.com/emdzej/keycloak-api-keys/releases/latest/download/keycloak-api-keys-spi.jar

# Copy to Keycloak providers directory
cp keycloak-api-keys-spi.jar /opt/keycloak/providers/

# Restart Keycloak
/opt/keycloak/bin/kc.sh build
/opt/keycloak/bin/kc.sh start
```

## Option 2: Docker

Use the pre-built Docker image:

```yaml
# docker-compose.yml
services:
  keycloak:
    image: ghcr.io/emdzej/keycloak-api-keys:latest
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8080:8080"
    command: start-dev
```

Or extend the official Keycloak image:

```dockerfile
FROM quay.io/keycloak/keycloak:26.8.2

COPY --from=ghcr.io/emdzej/keycloak-api-keys:latest \
  /opt/keycloak/providers/keycloak-api-keys-spi.jar \
  /opt/keycloak/providers/

RUN /opt/keycloak/bin/kc.sh build
```

## Option 3: Build from Source

```bash
git clone https://github.com/emdzej/keycloak-api-keys.git
cd keycloak-api-keys

./gradlew :spi:shadowJar

# Output: spi/build/libs/keycloak-api-keys-spi-*.jar
```

## Verify Installation

After restarting Keycloak, verify the SPI is loaded:

```bash
/opt/keycloak/bin/kc.sh show-config | grep api-keys
```

Or check the Admin Console:

1. Go to **Realm Settings** → **Events** → **Config**
2. Look for `api-key-*` event types in the available events

## Next Steps

- [Quick Start](/keycloak-api-keys/getting-started/quick-start/) — Create your first API key
- [SPI Configuration](/keycloak-api-keys/configuration/spi/) — Configure the extension
