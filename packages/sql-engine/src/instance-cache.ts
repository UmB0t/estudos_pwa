export interface Closeable {
  close(): Promise<void>;
}

export class InstanceCache<T extends Closeable> {
  private cache = new Map<string, T>();
  private maxInstances: number;

  constructor(maxInstances = 3) {
    this.maxInstances = maxInstances;
  }

  static makeKey(datasetSql?: string, setupSql?: string): string {
    return `${datasetSql ?? ''}:::${setupSql ?? ''}`;
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Marca como mais recentemente usada (LRU)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  async set(key: string, instance: T): Promise<void> {
    if (this.cache.has(key)) {
      const existing = this.cache.get(key);
      this.cache.delete(key);
      if (existing && existing !== instance) {
        await existing.close();
      }
    }

    while (this.cache.size >= this.maxInstances) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        const oldestInstance = this.cache.get(oldestKey);
        this.cache.delete(oldestKey);
        if (oldestInstance) {
          await oldestInstance.close();
        }
      }
    }

    this.cache.set(key, instance);
  }

  async clear(): Promise<void> {
    for (const instance of this.cache.values()) {
      await instance.close();
    }
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
