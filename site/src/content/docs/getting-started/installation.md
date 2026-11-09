---
title: Installation
description: Add the Keycloak API Keys provider to your Keycloak server.
---

The extension is a single provider JAR. It contains the grant type, the REST endpoints, the database migration and the Account Console theme.

## Requirements

- Keycloak 26.7 or later (tested with 26.8.2)
- A relational database that Keycloak supports. The provider adds its own table through a Liquibase changelog when Keycloak starts.
- Java 21 or later, only if you build from source

## Option 1: Maven Central

The provider is published as `pl.emdzej.keycloak:keycloak-api-keys-spi`. Use the `-all` JAR:

```bash
VERSION=0.2.0
curl -L -o /opt/keycloak/providers/keycloak-api-keys-spi.jar \
  "https://repo1.maven.org/maven2/pl/emdzej/keycloak/keycloak-api-keys-spi/$VERSION/keycloak-api-keys-spi-$VERSION-all.jar"

/opt/keycloak/bin/kc.sh build
/opt/keycloak/bin/kc.sh start
```

## Option 2: Container image

Extend the official image:

```dockerfile
FROM quay.io/keycloak/keycloak:26.8.2 AS builder

ARG VERSION=0.2.0
ADD --chown=keycloak:keycloak \
  https://repo1.maven.org/maven2/pl/emdzej/keycloak/keycloak-api-keys-spi/${VERSION}/keycloak-api-keys-spi-${VERSION}-all.jar \
  /opt/keycloak/providers/keycloak-api-keys-spi.jar

RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.8.2
COPY --from=builder /opt/keycloak/ /opt/keycloak/
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
```

On Kubernetes with the Keycloak Operator, put the same image in `spec.image` of your `Keycloak` resource.

## Option 3: Build from source

```bash
git clone https://github.com/emdzej/keycloak-api-keys.git
cd keycloak-api-keys
./gradlew :spi:shadowJar
# → spi/build/libs/keycloak-api-keys-spi-*-all.jar
```

For local development, `./scripts/dev.sh` builds the JAR and starts Keycloak and Postgres through Docker Compose at `http://localhost:8080` (`admin` / `admin`).

## Enable the Account Console UI

The self-service UI ships as an account theme named `api-keys`. To turn it on for a realm:

1. Open **Realm settings → Themes**.
2. Set **Account theme** to `api-keys`.
3. Save. Users now get an **API Keys** page in the Account Console.

You can skip this if keys are only managed through the REST API.

## Optional: key pepper

Set the `API_KEY_PEPPER` environment variable on Keycloak to store keys as HMAC-SHA-256 instead of plain SHA-256. A leaked database dump is then useless without the pepper.

:::caution
You can add a pepper to an existing installation. Keys created before it still validate through a plain SHA-256 fallback. Changing or removing the pepper later invalidates every key created with it, so treat it like any other long-lived secret.
:::

## Verify

The provider exposes health endpoints:

```bash
curl http://localhost:8080/realms/my-realm/api-keys/health
# {"status":"ok"}
```

## Next steps

- [Quick Start](/keycloak-api-keys/getting-started/quick-start/): create your first key
