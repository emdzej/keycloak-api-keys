export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TokenCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlSeconds: number): void {
    const ttl = Math.max(0, ttlSeconds) * 1000;
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  clear(): void {
    this.store.clear();
  }
}
