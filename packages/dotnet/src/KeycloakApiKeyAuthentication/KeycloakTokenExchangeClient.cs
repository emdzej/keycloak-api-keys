using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace EmDzej.KeycloakApiKeyAuthentication;

/// <summary>
/// Result of a successful API key exchange.
/// </summary>
public sealed record TokenExchangeResult(TokenResponse Token, ApiKeyClaimsInfo Claims);

/// <summary>Raw Keycloak token endpoint response.</summary>
public sealed class TokenResponse
{
    /// <summary>The JWT access token.</summary>
    [JsonPropertyName("access_token")]
    public string AccessToken { get; init; } = string.Empty;

    /// <summary>Token lifetime in seconds.</summary>
    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; init; }

    /// <summary>Token type, typically <c>Bearer</c>.</summary>
    [JsonPropertyName("token_type")]
    public string TokenType { get; init; } = string.Empty;

    /// <summary>Space-separated granted scopes.</summary>
    [JsonPropertyName("scope")]
    public string? Scope { get; init; }
}

/// <summary>
/// Decoded claims from the Keycloak access token.
/// </summary>
public sealed class ApiKeyClaimsInfo
{
    /// <summary>Subject (user ID).</summary>
    [JsonPropertyName("sub")]
    public string Sub { get; init; } = string.Empty;

    /// <summary>Authorized party (client ID the token was issued to).</summary>
    [JsonPropertyName("azp")]
    public string Azp { get; init; } = string.Empty;

    /// <summary>ID of the API key that was exchanged.</summary>
    [JsonPropertyName("api_key_id")]
    public string ApiKeyId { get; init; } = string.Empty;

    /// <summary>Preferred username.</summary>
    [JsonPropertyName("preferred_username")]
    public string? PreferredUsername { get; init; }

    /// <summary>Email address.</summary>
    [JsonPropertyName("email")]
    public string? Email { get; init; }

    /// <summary>Realm-level role assignments.</summary>
    [JsonPropertyName("realm_access")]
    public RealmAccess? RealmAccess { get; init; }

    /// <summary>Client-level role assignments keyed by client ID.</summary>
    [JsonPropertyName("resource_access")]
    public Dictionary<string, RealmAccess>? ResourceAccess { get; init; }

    /// <summary>Space-separated list of granted scopes.</summary>
    [JsonPropertyName("scope")]
    public string? Scope { get; init; }

    /// <summary>Token expiry as a Unix timestamp.</summary>
    [JsonPropertyName("exp")]
    public long? Exp { get; init; }

    /// <summary>Raw additional claims not covered by typed properties.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? AdditionalClaims { get; init; }
}

/// <summary>Roles container used by both <c>realm_access</c> and <c>resource_access</c>.</summary>
public sealed class RealmAccess
{
    /// <summary>List of role names.</summary>
    [JsonPropertyName("roles")]
    public List<string> Roles { get; init; } = [];
}

/// <summary>
/// Abstraction for the Keycloak token exchange operation.
/// Exposed publicly so consumers can substitute a test double or custom implementation.
/// </summary>
public interface IKeycloakTokenExchangeClient
{
    /// <summary>Exchanges an API key for a Keycloak access token and decoded claims.</summary>
    Task<TokenExchangeResult> ExchangeAsync(string apiKey, CancellationToken ct = default);
}

/// <summary>
/// Exchanges API keys for Keycloak access tokens via the custom grant type.
/// Uses <see cref="IHttpClientFactory"/> so connections are properly pooled and
/// the handler lifecycle is managed by the DI container.
/// </summary>
internal sealed class KeycloakTokenExchangeClient(
    IHttpClientFactory httpClientFactory,
    KeycloakApiKeyOptions options) : IKeycloakTokenExchangeClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    /// <summary>Named HttpClient used by this handler (registered in DI by the extension method).</summary>
    internal const string HttpClientName = "KeycloakApiKeyAuthentication";

    private readonly string _tokenUrl = BuildTokenUrl(options.ServerUrl, options.Realm);

    /// <summary>
    /// Exchanges the raw API key value for a Keycloak access token and decoded claims.
    /// </summary>
    /// <exception cref="ApiKeyExchangeException">
    /// Thrown when Keycloak returns a non-success response.
    /// </exception>
    public async Task<TokenExchangeResult> ExchangeAsync(string apiKey, CancellationToken ct = default)
    {
        using var client = httpClientFactory.CreateClient(HttpClientName);

        var body = new Dictionary<string, string>
        {
            ["grant_type"] = "urn:ietf:params:oauth:grant-type:api-key",
            ["api_key"]    = apiKey,
            ["client_id"]  = options.ClientId,
        };
        if (options.ClientSecret is { Length: > 0 } secret)
            body["client_secret"] = secret;

        using var response = await client.PostAsync(
            _tokenUrl,
            new FormUrlEncodedContent(body),
            ct);

        if (!response.IsSuccessStatusCode)
        {
            throw new ApiKeyExchangeException(
                $"Keycloak returned {(int)response.StatusCode} for API key exchange.",
                (int)response.StatusCode,
                response.Headers);
        }

        var token = await response.Content.ReadFromJsonAsync<TokenResponse>(JsonOptions, ct)
                    ?? throw new ApiKeyExchangeException("Empty response from Keycloak.", 200, response.Headers);

        var claims = DecodeJwtPayload(token.AccessToken);
        return new TokenExchangeResult(token, claims);
    }

    private static string BuildTokenUrl(string serverUrl, string realm)
    {
        var baseUrl = serverUrl.TrimEnd('/');
        return $"{baseUrl}/realms/{realm}/protocol/openid-connect/token";
    }

    private static ApiKeyClaimsInfo DecodeJwtPayload(string jwt)
    {
        var parts = jwt.Split('.');
        if (parts.Length < 2)
            throw new InvalidOperationException("Invalid JWT format.");

        var payloadJson = Base64UrlDecode(parts[1]);
        return JsonSerializer.Deserialize<ApiKeyClaimsInfo>(payloadJson, JsonOptions)
               ?? throw new InvalidOperationException("Failed to deserialize JWT payload.");
    }

    private static string Base64UrlDecode(string base64Url)
    {
        // Pad to a multiple of 4 then convert Base64URL → standard Base64
        var remainder = base64Url.Length % 4;
        var padded = remainder switch
        {
            2 => base64Url + "==",
            3 => base64Url + "=",
            _ => base64Url
        };
        var standard = padded.Replace('-', '+').Replace('_', '/');
        var bytes = Convert.FromBase64String(standard);
        return System.Text.Encoding.UTF8.GetString(bytes);
    }
}

/// <summary>
/// Thrown when the Keycloak token endpoint returns a non-success response.
/// </summary>
public sealed class ApiKeyExchangeException(
    string message,
    int statusCode,
    System.Net.Http.Headers.HttpResponseHeaders headers)
    : Exception(message)
{
    /// <summary>HTTP status code returned by Keycloak.</summary>
    public int StatusCode { get; } = statusCode;

    /// <summary>Response headers from Keycloak (includes rate-limit headers on 429).</summary>
    public System.Net.Http.Headers.HttpResponseHeaders ResponseHeaders { get; } = headers;
}
