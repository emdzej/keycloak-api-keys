using System.Net;
using System.Security.Claims;
using EmDzej.KeycloakApiKeyAuthentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace KeycloakApiKeyAuthentication.Tests;

/// <summary>
/// Integration-style tests for KeycloakApiKeyHandler using TestServer.
/// The exchange client is replaced with an NSubstitute double so no real
/// Keycloak instance is required.
/// </summary>
public sealed class KeycloakApiKeyHandlerTests : IAsyncLifetime
{
    private const string ValidKey       = "myapp_validkey";
    private const string InvalidKey     = "myapp_invalidkey";
    private const string RateLimitedKey = "myapp_ratelimitedkey";

    private readonly IKeycloakTokenExchangeClient _exchangeClient;
    private TestServer _server = null!;
    private HttpClient _client = null!;

    public KeycloakApiKeyHandlerTests()
    {
        _exchangeClient = Substitute.For<IKeycloakTokenExchangeClient>();

        var goodClaims = new ApiKeyClaimsInfo
        {
            Sub               = "user-123",
            Azp               = "my-app",
            ApiKeyId          = "key-abc",
            PreferredUsername = "alice",
            Email             = "alice@example.com",
            RealmAccess       = new RealmAccess { Roles = ["user", "admin"] },
        };
        var goodToken = new TokenResponse { AccessToken = BuildFakeJwt(goodClaims), ExpiresIn = 300 };
        _exchangeClient.ExchangeAsync(ValidKey, Arg.Any<CancellationToken>())
            .Returns(new TokenExchangeResult(goodToken, goodClaims));

        _exchangeClient.ExchangeAsync(InvalidKey, Arg.Any<CancellationToken>())
            .ThrowsAsync(new ApiKeyExchangeException("Unauthorized", 401,
                new HttpResponseMessage().Headers));

        var rateLimitResponse = new HttpResponseMessage();
        rateLimitResponse.Headers.Add("Retry-After", "60");
        _exchangeClient.ExchangeAsync(RateLimitedKey, Arg.Any<CancellationToken>())
            .ThrowsAsync(new ApiKeyExchangeException("Rate limited", 429,
                rateLimitResponse.Headers));
    }

    public async Task InitializeAsync()
    {
        var appBuilder = WebApplication.CreateBuilder();
        appBuilder.WebHost.UseTestServer();

        appBuilder.Services.AddAuthentication(KeycloakApiKeyExtensions.DefaultScheme)
            .AddKeycloakApiKeyAuthentication(options =>
            {
                options.ServerUrl = "http://localhost:8080";
                options.Realm     = "test";
                options.ClientId  = "my-app";
            });
        appBuilder.Services.AddAuthorization();
        appBuilder.Services.AddSingleton(_exchangeClient);

        var app = appBuilder.Build();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapGet("/", async (HttpContext ctx) =>
        {
            if (!ctx.User.Identity?.IsAuthenticated ?? true)
            {
                ctx.Response.StatusCode = 401;
                return;
            }
            var sub   = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var roles = string.Join(",", ctx.User.FindAll(ClaimTypes.Role).Select(c => c.Value));
            await ctx.Response.WriteAsync($"sub={sub};roles={roles}");
        });

        await app.StartAsync();
        _server = app.GetTestServer();
        _client = _server.CreateClient();
    }

    public Task DisposeAsync()
    {
        _client.Dispose();
        _server.Dispose();
        return Task.CompletedTask;
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task ValidApiKey_Returns200_WithClaimsInBody()
    {
        var response = await _client.GetAsync("/",
            new Dictionary<string, string> { ["X-API-Key"] = ValidKey });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("sub=user-123", body);
        Assert.Contains("admin", body);
    }

    [Fact]
    public async Task ValidApiKey_PopulatesNameIdentifierClaim()
    {
        var response = await GetWithKey(ValidKey);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("sub=user-123", body);
    }

    [Fact]
    public async Task ValidApiKey_PopulatesRoleClaims()
    {
        var response = await GetWithKey(ValidKey);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("admin", body);
        Assert.Contains("user",  body);
    }

    // ── Cache ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task SecondRequest_WithSameKey_DoesNotCallExchangeAgain()
    {
        await GetWithKey(ValidKey);
        await GetWithKey(ValidKey);

        // Exchange must have been called exactly once despite two requests
        await _exchangeClient.Received(1).ExchangeAsync(ValidKey, Arg.Any<CancellationToken>());
    }

    // ── Missing header ────────────────────────────────────────────────────────

    [Fact]
    public async Task MissingApiKeyHeader_Returns401()
    {
        var response = await _client.GetAsync("/");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MissingApiKeyHeader_Returns_WwwAuthenticate()
    {
        var response = await _client.GetAsync("/");
        Assert.NotNull(response.Headers.WwwAuthenticate.ToString());
    }

    // ── Invalid key ───────────────────────────────────────────────────────────

    [Fact]
    public async Task InvalidApiKey_Returns401()
    {
        var response = await GetWithKey(InvalidKey);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Rate limiting ─────────────────────────────────────────────────────────

    [Fact]
    public async Task RateLimitedKey_Returns401_AndForwardsRetryAfterHeader()
    {
        var response = await GetWithKey(RateLimitedKey);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.True(response.Headers.Contains("Retry-After"),
            "Retry-After header should be forwarded from Keycloak 429 response");
    }

    // ── Options validation ────────────────────────────────────────────────────

    [Fact]
    public void Options_Validate_ThrowsOnMissingServerUrl()
    {
        var options = new KeycloakApiKeyOptions { Realm = "r", ClientId = "c" };
        Assert.Throws<InvalidOperationException>(options.Validate);
    }

    [Fact]
    public void Options_Validate_ThrowsOnMissingRealm()
    {
        var options = new KeycloakApiKeyOptions { ServerUrl = "http://kc", ClientId = "c" };
        Assert.Throws<InvalidOperationException>(options.Validate);
    }

    [Fact]
    public void Options_Validate_ThrowsOnMissingClientId()
    {
        var options = new KeycloakApiKeyOptions { ServerUrl = "http://kc", Realm = "r" };
        Assert.Throws<InvalidOperationException>(options.Validate);
    }

    [Fact]
    public void Options_Validate_ThrowsOnNegativeCacheTtl()
    {
        var options = new KeycloakApiKeyOptions
        {
            ServerUrl = "http://kc", Realm = "r", ClientId = "c", CacheTtlSeconds = -1
        };
        Assert.Throws<InvalidOperationException>(options.Validate);
    }

    [Fact]
    public void Options_Validate_PassesWithValidOptions()
    {
        var options = new KeycloakApiKeyOptions
        {
            ServerUrl = "http://kc", Realm = "r", ClientId = "c"
        };
        var ex = Record.Exception(options.Validate);
        Assert.Null(ex);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Task<HttpResponseMessage> GetWithKey(string key)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/");
        request.Headers.Add("X-API-Key", key);
        return _client.SendAsync(request);
    }

    /// <summary>
    /// Builds a minimal fake JWT whose payload is the JSON-serialised claims object.
    /// The signature section is omitted — the handler doesn't validate the JWT signature,
    /// it only decodes the payload claims.
    /// </summary>
    private static string BuildFakeJwt(ApiKeyClaimsInfo claims)
    {
        var payload = System.Text.Json.JsonSerializer.Serialize(claims);
        var encoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(payload))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
        return $"eyJhbGciOiJSUzI1NiJ9.{encoded}.fakesig";
    }

}

file static class HttpClientExtensions
{
    public static Task<HttpResponseMessage> GetAsync(
        this HttpClient client, string url, Dictionary<string, string> headers)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        foreach (var (k, v) in headers) request.Headers.Add(k, v);
        return client.SendAsync(request);
    }
}
