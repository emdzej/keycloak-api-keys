---
title: .NET / ASP.NET Core
description: Protect ASP.NET Core APIs with Keycloak API keys.
---

`EmDzej.KeycloakApiKeyAuthentication` is an ASP.NET Core authentication handler. It exchanges the API key at Keycloak's token endpoint and fills `HttpContext.User` with the resulting claims, so `[Authorize]`, roles and policies work as usual. It targets .NET 10.

## Installation

```bash
dotnet add package EmDzej.KeycloakApiKeyAuthentication
```

## Setup

```csharp
// Program.cs
builder.Services
    .AddAuthentication(KeycloakApiKeyExtensions.DefaultScheme)
    .AddKeycloakApiKeyAuthentication(options =>
    {
        options.ServerUrl    = "https://auth.example.com";
        options.Realm        = "my-realm";
        options.ClientId     = "my-app";
        options.ClientSecret = builder.Configuration["Keycloak:ClientSecret"]; // omit for public clients
    });

builder.Services.AddAuthorization();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/profile", (ClaimsPrincipal user) => new
{
    UserId   = user.FindFirstValue(ClaimTypes.NameIdentifier),
    ApiKeyId = user.FindFirstValue("api_key_id"),
})
.RequireAuthorization();
```

```http
GET /api/profile HTTP/1.1
X-API-Key: myapp_a1b2c3…
```

## Options

| Property | Default | Description |
|----------|---------|-------------|
| `ServerUrl` | required | Keycloak base URL |
| `Realm` | required | Realm name |
| `ClientId` | required | Client the keys were issued for |
| `ClientSecret` | `null` | Required for confidential clients |
| `HeaderName` | `X-API-Key` | Header to read the key from |
| `CacheTtlSeconds` | `300` | Max seconds to cache a successful exchange |

## Claims

| Claim | Source |
|-------|--------|
| `ClaimTypes.NameIdentifier`, `sub` | Key owner's user ID |
| `ClaimTypes.Name`, `preferred_username` | Username |
| `ClaimTypes.Email` | Email |
| `ClaimTypes.Role` | Realm roles granted to the key |
| `client_role` | Client roles, as `<clientId>:<role>` |
| `azp` | Client the key is bound to |
| `api_key_id` | ID of the key used |
| `scope` | Granted scopes |

Realm roles map to `ClaimTypes.Role`, so role checks work directly:

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ReportsReader", p => p.RequireRole("reports-reader"));
});

app.MapGet("/api/reports", () => ...).RequireAuthorization("ReportsReader");
```

## Responses

| Situation | Response |
|-----------|----------|
| No key | No result. Other schemes can authenticate, otherwise the challenge returns `401` |
| Unknown, revoked or expired key, or wrong client | `401` with `WWW-Authenticate: ApiKey realm="…"` |
| Rate limit exceeded | `401`, with Keycloak's `X-RateLimit-*` headers forwarded |
| Authenticated but fails a policy | `403` |

## Custom cache

The default cache is in memory. To share it across instances, register your own `ITokenCache<ApiKeyClaimsInfo>` before adding the scheme:

```csharp
builder.Services.AddSingleton<ITokenCache<ApiKeyClaimsInfo>, MyRedisTokenCache>();
```

## Resilience

The exchange uses a named `HttpClient`, so you can attach retries or a circuit breaker:

```csharp
builder.Services
    .AddHttpClient(KeycloakTokenExchangeClient.HttpClientName)
    .AddStandardResilienceHandler(); // Microsoft.Extensions.Http.Resilience
```

## Multiple realms

Register one scheme per realm:

```csharp
builder.Services
    .AddAuthentication()
    .AddKeycloakApiKeyAuthentication("realm-a", o => { o.Realm = "a"; /* ... */ })
    .AddKeycloakApiKeyAuthentication("realm-b", o => { o.Realm = "b"; /* ... */ });
```
