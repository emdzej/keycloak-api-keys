using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EmDzej.KeycloakApiKeyAuthentication;

/// <summary>
/// ASP.NET Core authentication handler that validates API keys by exchanging them
/// for Keycloak access tokens and populating <see cref="ClaimsPrincipal"/> from
/// the returned JWT claims.
/// </summary>
public sealed class KeycloakApiKeyHandler : AuthenticationHandler<KeycloakApiKeyOptions>
{
    private readonly IKeycloakTokenExchangeClient _client;
    private readonly ITokenCache<ApiKeyClaimsInfo> _cache;

    /// <summary>
    /// The name used to register rate-limit response headers when Keycloak returns 429.
    /// </summary>
    private static readonly string[] RateLimitHeaderNames =
    [
        "Retry-After",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ];

    // The two internal types are resolved from DI by name — DI doesn't require public visibility
    // on concrete types, only on the interfaces. We use object + cast to work around the
    // C# accessibility constraint on public constructor parameter types.
    /// <inheritdoc />
    [System.Diagnostics.CodeAnalysis.SuppressMessage(
        "Design", "CA1062",
        Justification = "Parameters validated by DI container before injection.")]
    public KeycloakApiKeyHandler(
        IOptionsMonitor<KeycloakApiKeyOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IKeycloakTokenExchangeClient client,
        ITokenCache<ApiKeyClaimsInfo> cache)
        : base(options, logger, encoder)
    {
        _client = client;
        _cache  = cache;
    }

    /// <inheritdoc />
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var apiKey = Request.Headers[Options.HeaderName].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return AuthenticateResult.NoResult();
        }

        // Cache hit — skip the Keycloak round-trip
        var cached = _cache.Get(apiKey);
        if (cached is not null)
        {
            var cachedTicket = BuildTicket(cached);
            return AuthenticateResult.Success(cachedTicket);
        }

        try
        {
            var result = await _client.ExchangeAsync(apiKey, Context.RequestAborted);

            // Cache with the smaller of configured TTL and token's own expiry
            var ttl = Math.Min(Options.CacheTtlSeconds, result.Token.ExpiresIn);
            _cache.Set(apiKey, result.Claims, ttl);

            var ticket = BuildTicket(result.Claims);
            return AuthenticateResult.Success(ticket);
        }
        catch (ApiKeyExchangeException ex) when (ex.StatusCode == 429)
        {
            // Forward rate-limit headers to the client before failing
            foreach (var name in RateLimitHeaderNames)
            {
                if (ex.ResponseHeaders.TryGetValues(name, out var values))
                    Response.Headers[name] = values.FirstOrDefault();
            }

            Logger.LogWarning("API key exchange rate-limited by Keycloak (429).");
            return AuthenticateResult.Fail("Rate limit exceeded.");
        }
        catch (ApiKeyExchangeException ex)
        {
            Logger.LogDebug("API key exchange failed with status {Status}.", ex.StatusCode);
            return AuthenticateResult.Fail("Invalid API key.");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Unexpected error during API key exchange.");
            return AuthenticateResult.Fail("Authentication error.");
        }
    }

    /// <inheritdoc />
    protected override Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = 401;
        Response.Headers.WWWAuthenticate = $"ApiKey realm=\"{Options.Realm}\"";
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    protected override Task HandleForbiddenAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = 403;
        return Task.CompletedTask;
    }

    private AuthenticationTicket BuildTicket(ApiKeyClaimsInfo info)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, info.Sub),
            new("sub",       info.Sub),
            new("azp",       info.Azp),
            new("api_key_id", info.ApiKeyId),
        };

        if (info.PreferredUsername is { Length: > 0 } username)
        {
            claims.Add(new Claim(ClaimTypes.Name,  username));
            claims.Add(new Claim("preferred_username", username));
        }

        if (info.Email is { Length: > 0 } email)
            claims.Add(new Claim(ClaimTypes.Email, email));

        if (info.Scope is { Length: > 0 } scope)
            claims.Add(new Claim("scope", scope));

        // Realm roles → ClaimTypes.Role so [Authorize(Roles = "admin")] works
        if (info.RealmAccess?.Roles is { Count: > 0 } realmRoles)
        {
            foreach (var role in realmRoles)
                claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // Client roles (namespaced as "client:<clientId>:<role>")
        if (info.ResourceAccess is { Count: > 0 } resourceAccess)
        {
            foreach (var (clientId, access) in resourceAccess)
            foreach (var role in access.Roles)
                claims.Add(new Claim("client_role", $"{clientId}:{role}"));
        }

        var identity  = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        return new AuthenticationTicket(principal, Scheme.Name);
    }
}
