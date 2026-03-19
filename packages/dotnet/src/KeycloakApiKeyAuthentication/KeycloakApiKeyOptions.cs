using Microsoft.AspNetCore.Authentication;

namespace EmDzej.KeycloakApiKeyAuthentication;

/// <summary>
/// Options for the Keycloak API key authentication handler.
/// </summary>
public sealed class KeycloakApiKeyOptions : AuthenticationSchemeOptions
{
    /// <summary>
    /// Base URL of the Keycloak server — e.g. <c>https://auth.example.com</c>.
    /// </summary>
    public string ServerUrl { get; set; } = string.Empty;

    /// <summary>
    /// Keycloak realm name.
    /// </summary>
    public string Realm { get; set; } = string.Empty;

    /// <summary>
    /// Client ID used when exchanging API keys for tokens.
    /// </summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>
    /// Optional client secret (required for confidential clients).
    /// </summary>
    public string? ClientSecret { get; set; }

    /// <summary>
    /// HTTP header the handler reads the API key from.
    /// Defaults to <c>X-API-Key</c>.
    /// </summary>
    public string HeaderName { get; set; } = "X-API-Key";

    /// <summary>
    /// How long (in seconds) a successfully exchanged token is cached.
    /// The handler uses the smaller of this value and the token's own
    /// <c>expires_in</c> field so the cache never outlives the token.
    /// Defaults to 300 seconds (5 minutes).
    /// </summary>
    public int CacheTtlSeconds { get; set; } = 300;

    /// <inheritdoc />
    public override void Validate()
    {
        base.Validate();
        if (string.IsNullOrWhiteSpace(ServerUrl))
            throw new InvalidOperationException($"{nameof(ServerUrl)} must not be empty.");
        if (string.IsNullOrWhiteSpace(Realm))
            throw new InvalidOperationException($"{nameof(Realm)} must not be empty.");
        if (string.IsNullOrWhiteSpace(ClientId))
            throw new InvalidOperationException($"{nameof(ClientId)} must not be empty.");
        if (CacheTtlSeconds < 0)
            throw new InvalidOperationException($"{nameof(CacheTtlSeconds)} must be >= 0.");
    }
}
