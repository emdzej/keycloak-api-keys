---
title: Installation
description: How to install the Keycloak API Keys SPI extension.
---

# Installation

## Requirements

- Keycloak 24.0 or later
- Java 17 or later (for building from source)

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
FROM quay.io/keycloak/keycloak:24.0

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
