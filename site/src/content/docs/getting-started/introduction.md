---
title: Introduction
description: What Keycloak API Keys is, how it works, and when to use it.
---

**Keycloak API Keys** is a Keycloak extension that lets users issue long-lived API keys and exchange them for regular Keycloak access tokens. It ships as a provider JAR plus middleware for the common backend stacks.

## The problem

OAuth2 and OpenID Connect work well when there's a person and a browser. A lot of callers have neither:

- **CLI tools** that can't run a browser login
- **CI jobs, scripts and cron tasks** that run unattended
- **IoT devices** with limited capabilities
- **Third-party integrations** that only know how to send a static key

The usual workarounds are a service-account client with a shared secret, which users can't manage themselves, or a homegrown key system. The second gives you a second identity store to keep in sync with Keycloak.

## How it works

1. A user creates a key for a specific client, either in the Account Console or through the REST API. They pick which of their own roles the key carries, since a key has no roles unless they're listed. They can also narrow it to some of the client's scopes and give it an expiry date.
2. Keycloak stores only a hash of the key and returns the plain key once.
3. The caller sends the key to your API, by default in the `X-API-Key` header.
4. Your middleware exchanges the key at the realm's token endpoint using a custom grant:

   ```http
   POST /realms/my-realm/protocol/openid-connect/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=urn:ietf:params:oauth:grant-type:api-key&api_key=myapp_…&client_id=my-app&client_secret=…
   ```

5. Keycloak checks the key (hash, revocation, expiry, client binding, owner still enabled, rate limit) and issues a normal access token for the key's owner. The token runs through your protocol mappers like any other.
6. The middleware caches the result and hands your code the decoded claims.

Your services keep working with Keycloak JWTs. The key is just another way to get one.

## Key format

```
{prefix}_{64 random characters}
```

```
myapp_Xk9fQ2mT7vLp3RwYb8NcZ1aHs5JdG4eKu6iOy0tBqVxW2nMr7FgEj3hPl9CzDs
```

The prefix comes from the client ID: lowercased, with non-alphanumeric characters removed, and cut to 15 characters. A key found in a log or a repository therefore tells you which application it belongs to.

## What's in the token

The exchanged JWT carries the standard Keycloak claims, narrowed to what the key was granted:

| Claim | Value |
|-------|-------|
| `sub` | The key owner's user ID |
| `azp` | The client the key is bound to |
| `api_key_id` | ID of the key used |
| `realm_access.roles` | The owner's realm roles, limited to those granted to the key |
| `resource_access` | The same, for client roles |
| `scope` | The key's scopes combined with the client's default scopes |

## Security model

- Keys are stored as SHA-256 hashes, or HMAC-SHA-256 when an `API_KEY_PEPPER` is configured. The plain key can't be recovered.
- Each key is bound to one client. Exchanging it with a different `client_id` fails.
- A key can never grant more than its owner has. If the owner is disabled, the key stops working.
- Keys can be revoked at any time. An expiry date is optional. If you set one, it can be at most the realm's maximum TTL (1 year by default).
- Exchanges are rate limited, with limits configured per client or per realm. Key lifecycle actions emit Keycloak events.

## Next steps

- [Installation](/keycloak-api-keys/getting-started/installation/): add the provider to Keycloak
- [Quick Start](/keycloak-api-keys/getting-started/quick-start/): create a key and call a protected API
