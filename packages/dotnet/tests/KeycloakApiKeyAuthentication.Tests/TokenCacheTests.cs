using EmDzej.KeycloakApiKeyAuthentication;

namespace KeycloakApiKeyAuthentication.Tests;

public sealed class TokenCacheTests
{
    private readonly TokenCache<string> _cache = new();

    // ── Basic get/set ─────────────────────────────────────────────────────────

    [Fact]
    public void Get_ReturnsNull_WhenKeyNotPresent()
    {
        var result = _cache.Get("missing");
        Assert.Null(result);
    }

    [Fact]
    public void Set_ThenGet_ReturnsSameValue()
    {
        _cache.Set("key", "value", ttlSeconds: 60);
        Assert.Equal("value", _cache.Get("key"));
    }

    [Fact]
    public void Set_OverwritesExistingEntry()
    {
        _cache.Set("key", "first", ttlSeconds: 60);
        _cache.Set("key", "second", ttlSeconds: 60);
        Assert.Equal("second", _cache.Get("key"));
    }

    // ── TTL / expiry ──────────────────────────────────────────────────────────

    [Fact]
    public void Get_ReturnsNull_AfterEntryExpires()
    {
        _cache.Set("key", "value", ttlSeconds: 0); // zero TTL = already expired
        Assert.Null(_cache.Get("key"));
    }

    [Fact]
    public void Set_WithNegativeTtl_IsNoOp()
    {
        _cache.Set("key", "value", ttlSeconds: -1);
        Assert.Null(_cache.Get("key"));
    }

    [Fact]
    public void Get_RemovesExpiredEntry_OnAccess()
    {
        _cache.Set("key", "value", ttlSeconds: 0);
        _cache.Get("key"); // evicts
        // second access must also return null (entry was removed)
        Assert.Null(_cache.Get("key"));
    }

    // ── Isolation between keys ────────────────────────────────────────────────

    [Fact]
    public void DifferentKeys_AreStoredIndependently()
    {
        _cache.Set("a", "alpha", ttlSeconds: 60);
        _cache.Set("b", "beta",  ttlSeconds: 60);

        Assert.Equal("alpha", _cache.Get("a"));
        Assert.Equal("beta",  _cache.Get("b"));
    }

    // ── Clear ─────────────────────────────────────────────────────────────────

    [Fact]
    public void Clear_RemovesAllEntries()
    {
        _cache.Set("a", "alpha", ttlSeconds: 60);
        _cache.Set("b", "beta",  ttlSeconds: 60);

        _cache.Clear();

        Assert.Null(_cache.Get("a"));
        Assert.Null(_cache.Get("b"));
    }

    // ── Thread safety (smoke test) ────────────────────────────────────────────

    [Fact]
    public async Task ConcurrentSetAndGet_DoesNotThrow()
    {
        const int threads = 20;
        var tasks = Enumerable.Range(0, threads).Select(i => Task.Run(() =>
        {
            _cache.Set($"key-{i}", $"value-{i}", ttlSeconds: 60);
            _ = _cache.Get($"key-{i % 5}"); // cross-read
        }));
        await Task.WhenAll(tasks); // no exception = pass
    }
}
