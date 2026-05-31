export class TenantConfigCache {
  private static cache = new Map<string, { data: unknown; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  static get<T>(key: string): T | undefined {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.data as T;
    }
    return undefined;
  }

  static set(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static delete(key: string): void {
    this.cache.delete(key);
  }
}
