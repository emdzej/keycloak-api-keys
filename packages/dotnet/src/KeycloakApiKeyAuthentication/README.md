# EmDzej.KeycloakApiKeyAuthentication

ASP.NET Core authentication handler that validates API keys issued by
[keycloak-api-keys](https://github.com/emdzej/keycloak-api-keys) by exchanging
them for Keycloak access tokens, then populating `HttpContext.User` with the
resulting claims so `[Authorize]` and policy-based auth work without extra wiring.

## Installation

```bash
dotnet add package EmDzej.KeycloakApiKeyAuthentication
```

## Quick start

```csharp
// Program.cs
builder.Services
    .AddAuthentication(KeycloakApiKeyExtensions.DefaultScheme)
    .AddKeycloakApiKeyAuthentication(options =>
    {
        options.ServerUrl    = "https://auth.example.com";
        options.Realm        = "my-realm";
        options.ClientId     = "my-app";
        options.ClientSecret = builder.Configuration["Keycloak:ClientSecret"]; // optional
    });

builder.Services.AddAuthorization();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
```

Protect an endpoint:

```csharp
app.MapGet("/protected", (ClaimsPrincipal user) => $"Hello {user.Identity?.Name}")
   .RequireAuthorization();
```

Call it with an API key:

```http
GET /protected HTTP/1.1
X-API-Key: myapp_abc123...
```

## Options

| Property | Default | Description |
|---|---|---|
| `ServerUrl` | *(required)* | Keycloak base URL, e.g. `https://auth.example.com` |
| `Realm` | *(required)* | Keycloak realm name |
| `ClientId` | *(required)* | Client ID for the token exchange |
| `ClientSecret` | `null` | Client secret (required for confidential clients) |
| `HeaderName` | `X-API-Key` | HTTP header the handler reads the key from |
| `CacheTtlSeconds` | `300` | Max seconds to cache a successful exchange result |

## Claims

After a successful exchange the following claims are available on `HttpContext.User`:

| Claim | Source |
|---|---|
| `ClaimTypes.NameIdentifier` / `sub` | Keycloak user ID |
| `ClaimTypes.Name` / `preferred_username` | Keycloak username |
| `ClaimTypes.Email` | Keycloak email |
| `ClaimTypes.Role` | Realm roles (enables `[Authorize(Roles = "admin")]`) |
| `client_role` | Client roles as `<clientId>:<role>` |
| `api_key_id` | ID of the API key used |
| `scope` | Granted scopes |

## Using with authorization policies

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy =>
        policy.RequireRole("admin"));
});
```

## Custom cache

Swap the default in-memory cache for a distributed one:

```csharp
builder.Services.AddSingleton<ITokenCache<ApiKeyClaimsInfo>, MyRedisTokenCache>();
builder.Services
    .AddAuthentication(KeycloakApiKeyExtensions.DefaultScheme)
    .AddKeycloakApiKeyAuthentication(options => { ... });
```

## Custom HttpClient (retry, circuit breaker)

```csharp
builder.Services
    .AddHttpClient(KeycloakTokenExchangeClient.HttpClientName)
    .AddStandardResilienceHandler();   // Microsoft.Extensions.Http.Resilience
```

## Multiple schemes

```csharp
builder.Services
    .AddAuthentication()
    .AddKeycloakApiKeyAuthentication("realm-a", options => { options.Realm = "a"; ... })
    .AddKeycloakApiKeyAuthentication("realm-b", options => { options.Realm = "b"; ... });
```
