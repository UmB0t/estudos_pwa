import type { StorageAdapter } from '../adapter.js';
import { IndexedDbAdapter } from './indexeddb-adapter.js';
import { MemoryStorageAdapter } from './memory-adapter.js';

/**
 * Creates the best available StorageAdapter:
 * - Attempts IndexedDbAdapter in browser environments
 * - Resiliently falls back to MemoryStorageAdapter if IndexedDB is unavailable or restricted (e.g., incognito/private mode)
 */
export async function createAutoStorageAdapter(): Promise<StorageAdapter> {
  if (IndexedDbAdapter.isSupported()) {
    try {
      const adapter = new IndexedDbAdapter();
      await adapter.init();
      return adapter;
    } catch (err) {
      console.warn(
        '[progression-engine] Falha ao inicializar IndexedDB. Usando MemoryStorageAdapter como fallback resiliente:',
        err
      );
    }
  }

  const memoryAdapter = new MemoryStorageAdapter();
  await memoryAdapter.init();
  return memoryAdapter;
}
