using System.Collections.Concurrent;

namespace EmDzej.KeycloakApiKeyAuthentication;

/// <summary>
/// Abstraction for the API key claims cache.
/// Exposed publicly so consumers can substitute a custom implementation
/// (e.g. distributed cache) when registering the authentication handler.
/// </summary>
public interface ITokenCache<T>
{
    /// <summary>Returns a cached value, or <see langword="null"/> if missing or expired.</summary>
    T? Get(string key);
    /// <summary>Stores a value with the given TTL in seconds.</summary>
    void Set(string key, T value, int ttlSeconds);
    /// <summary>Removes all entries.</summary>
    void Clear();
}

/// <summary>
/// Thread-safe in-memory cache for exchanged token results.
/// Entries are evicted lazily on access once they expire.
/// </summary>
internal sealed class TokenCache<T> : ITokenCache<T>
{
    private readonly record struct Entry(T Value, long ExpiresAtTicks);

    private readonly ConcurrentDictionary<string, Entry> _store = new();

    /// <summary>
    /// Retrieves a cached value, or <see langword="null"/> if missing or expired.
    /// </summary>
    public T? Get(string key)
    {
        if (!_store.TryGetValue(key, out var entry))
            return default;

        if (Environment.TickCount64 >= entry.ExpiresAtTicks)
        {
            _store.TryRemove(key, out _);
            return default;
        }

        return entry.Value;
    }

    /// <summary>
    /// Stores a value with the given TTL in seconds. Zero or negative TTL is a no-op.
    /// </summary>
    public void Set(string key, T value, int ttlSeconds)
    {
        if (ttlSeconds <= 0)
            return;

        var expiresAt = Environment.TickCount64 + (long)ttlSeconds * 1_000;
        _store[key] = new Entry(value, expiresAt);
    }

    /// <summary>Removes all entries from the cache.</summary>
    public void Clear() => _store.Clear();
}
