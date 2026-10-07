import type { ExerciseProgress, Profile } from './types.js';

export interface StorageAdapter {
  init(): Promise<void>;
  close(): Promise<void>;
  clear(): Promise<void>;

  // Active Profile
  getActiveProfileId(): Promise<string | null>;
  setActiveProfileId(id: string): Promise<void>;

  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfile(id: string): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<void>;
  deleteProfile(id: string): Promise<void>;

  // Progress
  getProgress(profileId: string, exerciseId: string): Promise<ExerciseProgress | null>;
  getAllProgress(profileId: string): Promise<ExerciseProgress[]>;
  saveProgress(progress: ExerciseProgress): Promise<void>;
  deleteProgressByProfile(profileId: string): Promise<void>;
}
