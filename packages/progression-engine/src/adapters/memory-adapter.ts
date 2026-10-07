import type { StorageAdapter } from '../adapter.js';
import type { ExerciseProgress, Profile } from '../types.js';

export class MemoryStorageAdapter implements StorageAdapter {
  private profiles = new Map<string, Profile>();
  private progressMap = new Map<string, ExerciseProgress>();
  private activeProfileId: string | null = null;

  private getProgressKey(profileId: string, exerciseId: string): string {
    return `${profileId}::${exerciseId}`;
  }

  private clone<T>(val: T): T {
    return JSON.parse(JSON.stringify(val)) as T;
  }

  async init(): Promise<void> {
    // No-op for in-memory adapter
  }

  async close(): Promise<void> {
    // No-op for in-memory adapter
  }

  async clear(): Promise<void> {
    this.profiles.clear();
    this.progressMap.clear();
    this.activeProfileId = null;
  }

  async getActiveProfileId(): Promise<string | null> {
    return this.activeProfileId;
  }

  async setActiveProfileId(id: string): Promise<void> {
    this.activeProfileId = id;
  }

  async getProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values()).map((p) => this.clone(p));
  }

  async getProfile(id: string): Promise<Profile | null> {
    const profile = this.profiles.get(id);
    return profile ? this.clone(profile) : null;
  }

  async saveProfile(profile: Profile): Promise<void> {
    this.profiles.set(profile.id, this.clone(profile));
  }

  async deleteProfile(id: string): Promise<void> {
    this.profiles.delete(id);
    await this.deleteProgressByProfile(id);
    if (this.activeProfileId === id) {
      this.activeProfileId = null;
    }
  }

  async getProgress(profileId: string, exerciseId: string): Promise<ExerciseProgress | null> {
    const key = this.getProgressKey(profileId, exerciseId);
    const item = this.progressMap.get(key);
    return item ? this.clone(item) : null;
  }

  async getAllProgress(profileId: string): Promise<ExerciseProgress[]> {
    const result: ExerciseProgress[] = [];
    for (const item of this.progressMap.values()) {
      if (item.profileId === profileId) {
        result.push(this.clone(item));
      }
    }
    return result;
  }

  async saveProgress(progress: ExerciseProgress): Promise<void> {
    const key = this.getProgressKey(progress.profileId, progress.exerciseId);
    this.progressMap.set(key, this.clone(progress));
  }

  async deleteProgressByProfile(profileId: string): Promise<void> {
    for (const [key, item] of Array.from(this.progressMap.entries())) {
      if (item.profileId === profileId) {
        this.progressMap.delete(key);
      }
    }
  }
}
