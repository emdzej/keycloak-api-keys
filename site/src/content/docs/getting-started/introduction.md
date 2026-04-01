---
title: Introduction
description: What is Keycloak API Keys and why you might need it.
---

# Introduction

**Keycloak API Keys** is a Keycloak SPI (Service Provider Interface) extension that adds API key management capabilities to your Keycloak instance.

## The Problem

OAuth2 and OpenID Connect are fantastic for user authentication and authorization. But not every client speaks OAuth2:

- **CLI tools** that need to authenticate without a browser flow
- **IoT devices** with limited capabilities
- **Scripts and cron jobs** that run unattended
- **Legacy systems** that can't be easily updated
- **Third-party integrations** that expect API keys

You could issue long-lived tokens, but that's a security risk. You could build a custom API key system, but then you have two identity systems to manage.

## The Solution

Keycloak API Keys brings API key management into Keycloak itself:

- **Single source of truth** — Keycloak remains your identity authority
- **Token introspection** — Keys are validated through standard OAuth2 introspection
- **Per-client prefixes** — Each client has its own prefix for easy identification
- **Full lifecycle** — Create, list, revoke, and audit keys through the API or Admin UI
- **Scopes and roles** — Keys inherit the client's configured scopes and roles

## Key Format

API keys follow a simple format:

```
{prefix}_{64_random_chars}
```

For example:
```
myapp_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

The prefix is configured per-client, making it easy to identify which application a key belongs to just by looking at it.

## Security

- Keys are stored as SHA-256 hashes — the original key cannot be recovered
- Each key is bound to a specific client
- Keys can be revoked instantly
- All operations are audited
- Rate limiting is supported

## Next Steps

- [Installation](/keycloak-api-keys/getting-started/installation/) — Deploy the SPI to your Keycloak instance
- [Quick Start](/keycloak-api-keys/getting-started/quick-start/) — Create your first API key in 5 minutes
