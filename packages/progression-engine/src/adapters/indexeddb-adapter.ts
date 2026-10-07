import type { StorageAdapter } from '../adapter.js';
import type { ExerciseProgress, Profile } from '../types.js';

const DB_NAME = 'sql_linux_lab_db';
const DB_VERSION = 1;

interface StoredProgressRecord extends ExerciseProgress {
  id: string; // Composite key: `${profileId}::${exerciseId}`
}

export class IndexedDbAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;

  static isSupported(): boolean {
    try {
      return typeof globalThis !== 'undefined' && 'indexedDB' in globalThis && globalThis.indexedDB !== null;
    } catch {
      return false;
    }
  }

  private getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('IndexedDbAdapter não foi inicializado. Chame init() primeiro.');
    }
    return this.db;
  }

  private getProgressKey(profileId: string, exerciseId: string): string {
    return `${profileId}::${exerciseId}`;
  }

  async init(): Promise<void> {
    if (!IndexedDbAdapter.isSupported()) {
      throw new Error('IndexedDB não é suportado neste ambiente.');
    }

    return new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
          progressStore.createIndex('by_profileId', 'profileId', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Falha ao abrir IndexedDB: ${request.error?.message ?? 'Erro desconhecido'}`));
      };
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async clear(): Promise<void> {
    const db = this.getDB();
    const storeNames = ['profiles', 'progress', 'settings'] as const;

    await Promise.all(
      storeNames.map(
        (name) =>
          new Promise<void>((resolve, reject) => {
            const tx = db.transaction(name, 'readwrite');
            const store = tx.objectStore(name);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          })
      )
    );
  }

  async getActiveProfileId(): Promise<string | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('activeProfileId');

      req.onsuccess = () => {
        const result = req.result as { key: string; value: string } | undefined;
        resolve(result?.value ?? null);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async setActiveProfileId(id: string): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ key: 'activeProfileId', value: id });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getProfiles(): Promise<Profile[]> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readonly');
      const store = tx.objectStore('profiles');
      const req = store.getAll();

      req.onsuccess = () => {
        resolve((req.result as Profile[]) || []);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async getProfile(id: string): Promise<Profile | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readonly');
      const store = tx.objectStore('profiles');
      const req = store.get(id);

      req.onsuccess = () => {
        resolve((req.result as Profile) || null);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async saveProfile(profile: Profile): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readwrite');
      const store = tx.objectStore('profiles');
      const req = store.put(profile);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteProfile(id: string): Promise<void> {
    const db = this.getDB();
    await this.deleteProgressByProfile(id);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('profiles', 'readwrite');
      const store = tx.objectStore('profiles');
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    const activeId = await this.getActiveProfileId();
    if (activeId === id) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        const req = store.delete('activeProfileId');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }

  async getProgress(profileId: string, exerciseId: string): Promise<ExerciseProgress | null> {
    const db = this.getDB();
    const key = this.getProgressKey(profileId, exerciseId);

    return new Promise((resolve, reject) => {
      const tx = db.transaction('progress', 'readonly');
      const store = tx.objectStore('progress');
      const req = store.get(key);

      req.onsuccess = () => {
        const record = req.result as StoredProgressRecord | undefined;
        if (!record) {
          resolve(null);
          return;
        }
        const progress = { ...record };
        delete (progress as Partial<StoredProgressRecord>).id;
        resolve(progress as ExerciseProgress);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async getAllProgress(profileId: string): Promise<ExerciseProgress[]> {
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('progress', 'readonly');
      const store = tx.objectStore('progress');
      const index = store.index('by_profileId');
      const req = index.getAll(profileId);

      req.onsuccess = () => {
        const records = (req.result as StoredProgressRecord[]) || [];
        const result = records.map((rec) => {
          const progress = { ...rec };
          delete (progress as Partial<StoredProgressRecord>).id;
          return progress as ExerciseProgress;
        });
        resolve(result);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async saveProgress(progress: ExerciseProgress): Promise<void> {
    const db = this.getDB();
    const key = this.getProgressKey(progress.profileId, progress.exerciseId);
    const storedRecord: StoredProgressRecord = {
      ...progress,
      id: key,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('progress', 'readwrite');
      const store = tx.objectStore('progress');
      const req = store.put(storedRecord);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteProgressByProfile(profileId: string): Promise<void> {
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('progress', 'readwrite');
      const store = tx.objectStore('progress');
      const index = store.index('by_profileId');
      const req = index.getAllKeys(profileId);

      req.onsuccess = () => {
        const keys = req.result;
        for (const k of keys) {
          store.delete(k);
        }
        resolve();
      };

      req.onerror = () => reject(req.error);
    });
  }
}
