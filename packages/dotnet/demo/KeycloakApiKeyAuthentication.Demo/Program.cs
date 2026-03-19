using System.Security.Claims;
using EmDzej.KeycloakApiKeyAuthentication;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration ─────────────────────────────────────────────────────────────
// Reads from environment variables with fallbacks for local dev.
// Matches the same env var names used by the Node.js and Spring demos.
var keycloakUrl = builder.Configuration["KEYCLOAK_URL"]    ?? "http://localhost:8080";
var realm       = builder.Configuration["KEYCLOAK_REALM"]  ?? "master";
var clientId    = builder.Configuration["CLIENT_ID"]       ?? "admin-cli";
var clientSecret = builder.Configuration["CLIENT_SECRET"];   // null = public client
var port        = int.TryParse(builder.Configuration["PORT"], out var p) ? p : 3006;

// ── Authentication ────────────────────────────────────────────────────────────
builder.Services
    .AddAuthentication(KeycloakApiKeyExtensions.DefaultScheme)
    .AddKeycloakApiKeyAuthentication(options =>
    {
        options.ServerUrl    = keycloakUrl;
        options.Realm        = realm;
        options.ClientId     = clientId;
        options.ClientSecret = clientSecret;
        options.CacheTtlSeconds = 60;
    });

builder.Services.AddAuthorization();

// ── App ───────────────────────────────────────────────────────────────────────
var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// Public — no key required
app.MapGet("/health", () => Results.Ok(new { status = "ok", middleware = "aspnetcore" }))
   .AllowAnonymous();

// Protected — API key required
app.MapGet("/api/profile", [Authorize] (ClaimsPrincipal user) =>
{
    var roles = user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
    return Results.Ok(new
    {
        message  = "Hello from ASP.NET Core!",
        user     = new
        {
            sub      = user.FindFirstValue("sub"),
            azp      = user.FindFirstValue("azp"),
            apiKeyId = user.FindFirstValue("api_key_id"),
            scope    = user.FindFirstValue("scope"),
            roles,
        }
    });
});

app.MapGet("/api/data", [Authorize] () =>
    Results.Ok(new
    {
        items = new[]
        {
            new { id = 1, name = "Widget A", price = 9.99  },
            new { id = 2, name = "Widget B", price = 19.99 },
            new { id = 3, name = "Widget C", price = 29.99 },
        }
    }));

app.MapPost("/api/echo", [Authorize] async (HttpRequest request, ClaimsPrincipal user) =>
{
    using var reader = new System.IO.StreamReader(request.Body);
    var body = await reader.ReadToEndAsync();
    return Results.Ok(new
    {
        received        = body,
        authenticatedAs = user.FindFirstValue("sub"),
    });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.Urls.Add($"http://localhost:{port}");

Console.WriteLine($"ASP.NET Core demo listening on http://localhost:{port}");
Console.WriteLine($"  GET  /health       — public");
Console.WriteLine($"  GET  /api/profile  — protected");
Console.WriteLine($"  GET  /api/data     — protected");
Console.WriteLine($"  POST /api/echo     — protected");
Console.WriteLine();
Console.WriteLine($"  Keycloak : {keycloakUrl}");
Console.WriteLine($"  Realm    : {realm}");
Console.WriteLine($"  ClientId : {clientId}");

app.Run();
