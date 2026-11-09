---
title: Managing Keys with kcctl
description: Use kcctl, the Keycloak command line, to issue, list and revoke API keys.
---

Keycloak API Keys supports [kcctl](https://github.com/emdzej/kcctl), a command line for the Keycloak Admin API. The extension ships a kcctl manifest, so kcctl gets an `api-key` command that works like its built-in ones: users by username instead of UUID, shell completion, `-o json`, and paging.

## 1. Enable the manifest endpoint

The provider serves the manifest at `GET /admin/realms/{realm}/api-keys/kcctl-extension`. It is off by default. Start Keycloak with:

```bash
kc.sh start --spi-admin-realm-restapi-extension--api-keys--kcctl-extension-enabled=true
```

or set `KC_SPI_ADMIN_REALM_RESTAPI_EXTENSION__API_KEYS__KCCTL_EXTENSION_ENABLED=true`. See [SPI Configuration](/keycloak-api-keys/configuration/spi/#provider-options).

:::note
The endpoint is available in releases after 0.2.0. On 0.2.0, or if you'd rather not enable it, [install the manifest by hand](#installing-the-manifest-by-hand).
:::

## 2. Sign in

You need kcctl 0.2.0 or later ([releases](https://github.com/emdzej/kcctl/releases)). Signing in also discovers the extensions on the server:

```bash
kcctl config set-context local --server http://localhost:8080 --username admin
kcctl auth login
kcctl extension list        # api-keys should be listed
```

kcctl finds the extension through `/admin/serverinfo`, then fetches the manifest. To fetch it again later, for example after enabling the endpoint, run `kcctl extension discover`.

## 3. Manage keys

```bash
# issue a key; the plain key is printed once
kcctl api-key create alice --name ci --client my-app --role deployer --expires-at 2027-01-01T00:00:00Z

# write only the key to a file
kcctl api-key create alice --name ci --client my-app -o jsonpath='$.key' > ci.key

# list keys in the realm
kcctl api-key list
kcctl api-key list --user alice --status active
kcctl api-key list --client my-app --status expired

# usage of one key, then revoke it
kcctl api-key stats <id>
kcctl api-key revoke <id>

# extension health: key count, rate limiter
kcctl api-key health
```

| Command | Admin API call |
|---------|----------------|
| `api-key list` (`ls`) | `GET /admin/realms/{realm}/api-keys` with `--user`, `--client`, `--status active\|revoked\|expired` |
| `api-key create <user>` | `POST …/api-keys/users/{user}/api-keys` with `--name`, `--client` (both required), `--role`, `--scope` (repeatable) and `--expires-at` |
| `api-key stats <id>` | `GET …/api-keys/{id}/stats` |
| `api-key revoke <id>` (`delete`, `rm`) | `DELETE …/api-keys/{id}` |
| `api-key health` | `GET …/api-keys/health` |

The same rules as the [Admin API](/keycloak-api-keys/api/admin/) apply. You need `view-realm` to read keys and `manage-realm` to create or revoke them. A key carries only the roles passed with `--role`. A role name resolves to a client role of `--client` first, then to a realm role.

## Installing the manifest by hand

kcctl can also load the manifest from a file. The file is [`kcctl-extension.yaml`](https://github.com/emdzej/keycloak-api-keys/blob/main/spi/src/main/resources/kcctl-extension.yaml) in the provider sources:

```bash
curl -fsSLO https://raw.githubusercontent.com/emdzej/keycloak-api-keys/main/spi/src/main/resources/kcctl-extension.yaml
kcctl extension install kcctl-extension.yaml
```

A manifest installed this way applies to every server you use with kcctl, and replaces a discovered one with the same name. To remove it, run `kcctl extension remove api-keys`.

kcctl's [extension docs](https://github.com/emdzej/kcctl/blob/main/docs/extensions.md) explain how manifests work.
