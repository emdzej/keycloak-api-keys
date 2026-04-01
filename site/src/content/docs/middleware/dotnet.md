---
title: .NET / ASP.NET Core
description: Integrate Keycloak API Keys with ASP.NET Core applications.
---

# .NET / ASP.NET Core

The NuGet package provides authentication handlers for ASP.NET Core.

## Installation

```bash
dotnet add package EmDzej.KeycloakApiKeyAuthentication
```

## Basic Usage

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddAuthentication()
    .AddKeycloakApiKey(options =>
    {
        options.KeycloakUrl = "https://auth.example.com";
        options.Realm = "my-realm";
        options.ClientId = "my-api";
        options.ClientSecret = builder.Configuration["Keycloak:ClientSecret"];
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/data", (HttpContext context) =>
{
    var apiKey = context.GetApiKey();
    return Results.Ok(new { keyId = apiKey?.Id });
}).RequireAuthorization();

app.Run();
```

## Configuration

### appsettings.json

```json
{
  "Keycloak": {
    "Url": "https://auth.example.com",
    "Realm": "my-realm",
    "ClientId": "my-api",
    "ClientSecret": "secret"
  }
}
```

### Options binding

```csharp
builder.Services
    .AddAuthentication()
    .AddKeycloakApiKey(
        builder.Configuration.GetSection("Keycloak"));
```

## Configuration Options

```csharp
public class KeycloakApiKeyOptions
{
    public string KeycloakUrl { get; set; }
    public string Realm { get; set; }
    public string ClientId { get; set; }
    public string ClientSecret { get; set; }
    
    // Optional
    public string HeaderName { get; set; } = "X-API-Key";
    public TimeSpan CacheDuration { get; set; } = TimeSpan.FromMinutes(1);
}
```

## Accessing API Key Info

```csharp
app.MapGet("/api/data", (HttpContext context) =>
{
    var apiKey = context.GetApiKey();
    
    if (apiKey is null)
        return Results.Unauthorized();
    
    return Results.Ok(new
    {
        KeyId = apiKey.Id,
        KeyName = apiKey.Name,
        ClientId = apiKey.ClientId,
        Scopes = apiKey.Scopes
    });
}).RequireAuthorization();
```

## Policy-Based Authorization

```csharp
// Configure policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ReadAccess", policy =>
        policy.RequireClaim("scope", "read"));
    
    options.AddPolicy("WriteAccess", policy =>
        policy.RequireClaim("scope", "write"));
    
    options.AddPolicy("AdminAccess", policy =>
        policy.RequireClaim("scope", "admin"));
});

// Use policies
app.MapGet("/api/read", () => Results.Ok())
    .RequireAuthorization("ReadAccess");

app.MapPost("/api/write", () => Results.Ok())
    .RequireAuthorization("WriteAccess");
```

## Controller-Based APIs

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = KeycloakApiKeyDefaults.AuthenticationScheme)]
public class DataController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        var apiKey = HttpContext.GetApiKey();
        return Ok(new { keyId = apiKey?.Id });
    }
    
    [HttpPost]
    [Authorize(Policy = "WriteAccess")]
    public IActionResult Post([FromBody] DataDto data)
    {
        return Created();
    }
}
```

## Mixed Authentication

Support both API keys and JWT:

```csharp
builder.Services
    .AddAuthentication()
    .AddKeycloakApiKey(options => { /* ... */ })
    .AddJwtBearer(options => { /* ... */ });

builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .AddAuthenticationSchemes(
            KeycloakApiKeyDefaults.AuthenticationScheme,
            JwtBearerDefaults.AuthenticationScheme)
        .RequireAuthenticatedUser()
        .Build();
});
```

## Custom Error Responses

```csharp
builder.Services
    .AddAuthentication()
    .AddKeycloakApiKey(options =>
    {
        // ...
        options.Events = new KeycloakApiKeyEvents
        {
            OnAuthenticationFailed = context =>
            {
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsJsonAsync(new
                {
                    error = "Invalid API key",
                    hint = "Verify your key is correct and active"
                });
            }
        };
    });
```

## Minimal API with Filters

```csharp
app.MapGet("/api/data", [Authorize] (HttpContext ctx) =>
{
    return Results.Ok(new { key = ctx.GetApiKey()?.Name });
});
```

## Testing

```csharp
public class ApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    
    public ApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }
    
    [Fact]
    public async Task Should_Authenticate_With_Valid_Key()
    {
        _client.DefaultRequestHeaders.Add("X-API-Key", "test_validkey");
        
        var response = await _client.GetAsync("/api/data");
        
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
    
    [Fact]
    public async Task Should_Reject_Invalid_Key()
    {
        _client.DefaultRequestHeaders.Add("X-API-Key", "invalid");
        
        var response = await _client.GetAsync("/api/data");
        
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
```

## Next Steps

- [Java Middleware](/keycloak-api-keys/middleware/java/) — Spring Boot integration
- [Node.js Middleware](/keycloak-api-keys/middleware/node/) — Express integration
