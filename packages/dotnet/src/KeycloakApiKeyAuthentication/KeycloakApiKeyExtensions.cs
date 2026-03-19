using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

namespace EmDzej.KeycloakApiKeyAuthentication;

/// <summary>
/// Extension methods for registering Keycloak API key authentication in ASP.NET Core.
/// </summary>
public static class KeycloakApiKeyExtensions
{
    /// <summary>Default scheme name used when none is specified.</summary>
    public const string DefaultScheme = "KeycloakApiKey";

    /// <summary>
    /// Adds Keycloak API key authentication using the default scheme name
    /// (<c>KeycloakApiKey</c>) and configures options via a delegate.
    /// </summary>
    /// <example>
    /// <code>
    /// builder.Services.AddAuthentication()
    ///     .AddKeycloakApiKeyAuthentication(options =>
    ///     {
    ///         options.ServerUrl  = "https://auth.example.com";
    ///         options.Realm      = "my-realm";
    ///         options.ClientId   = "my-app";
    ///     });
    /// </code>
    /// </example>
    public static AuthenticationBuilder AddKeycloakApiKeyAuthentication(
        this AuthenticationBuilder builder,
        Action<KeycloakApiKeyOptions> configureOptions)
        => builder.AddKeycloakApiKeyAuthentication(DefaultScheme, configureOptions);

    /// <summary>
    /// Adds Keycloak API key authentication using a custom scheme name.
    /// Use this overload when registering multiple authentication schemes.
    /// </summary>
    public static AuthenticationBuilder AddKeycloakApiKeyAuthentication(
        this AuthenticationBuilder builder,
        string scheme,
        Action<KeycloakApiKeyOptions> configureOptions)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentException.ThrowIfNullOrWhiteSpace(scheme);
        ArgumentNullException.ThrowIfNull(configureOptions);

        // Register a named HttpClient for Keycloak calls — consumers can customise
        // it further (e.g. add Polly retry policy) by calling AddHttpClient after.
        builder.Services.AddHttpClient(KeycloakTokenExchangeClient.HttpClientName);

        // Singleton cache — shared across all requests for the same scheme
        builder.Services.TryAddSingleton<ITokenCache<ApiKeyClaimsInfo>, TokenCache<ApiKeyClaimsInfo>>();

        // Register the exchange client as a singleton keyed to the configured options.
        // We resolve KeycloakApiKeyOptions at registration time so the client is
        // pre-configured — options are validated here, not lazily on first request.
        builder.Services.AddSingleton<IKeycloakTokenExchangeClient>(sp =>
        {
            var monitor = sp.GetRequiredService<IOptionsMonitor<KeycloakApiKeyOptions>>();
            var options = monitor.Get(scheme);
            options.Validate();
            var factory = sp.GetRequiredService<IHttpClientFactory>();
            return new KeycloakTokenExchangeClient(factory, options);
        });

        builder.AddScheme<KeycloakApiKeyOptions, KeycloakApiKeyHandler>(scheme, configureOptions);

        return builder;
    }
}
