import type { StorageAdapter } from './adapter.js';
import { MemoryStorageAdapter } from './adapters/memory-adapter.js';
import { mergeDatasets, validateImportPayload } from './merge.js';
import { calculateProgressStats, type ExerciseMeta } from './metrics.js';
import {
  ensureProfileDefaults,
  getLocalDateString,
  updateStreakAndActivity,
} from './streak.js';
import {
  type ExerciseAttemptRecord,
  type ExerciseProgress,
  type OverallStats,
  type Profile,
  type ProgressExportData,
} from './types.js';

export const DEFAULT_PROFILE_ID = 'default-student';
export const DEFAULT_PROFILE_NAME = 'Estudante';

export interface RecordAttemptParams {
  exerciseId: string;
  trackId: string;
  moduleId: string;
  code: string;
  status: 'correct' | 'almost' | 'wrong' | 'error';
  isSuccess: boolean;
  executionTimeMs?: number;
  hintsViewed?: number;
  profileId?: string;
}

export interface RecordDailyActivityParams {
  profileId?: string;
  xpEarned?: number;
  date?: string;
}

export class ProgressionEngine {
  private adapter: StorageAdapter;
  private initialized = false;

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter ?? new MemoryStorageAdapter();
  }

  get storage(): StorageAdapter {
    return this.adapter;
  }

  /**
   * Initializes the engine and ensures a default profile exists on first access.
   */
  async init(): Promise<Profile> {
    await this.adapter.init();
    this.initialized = true;

    const profiles = await this.adapter.getProfiles();

    if (profiles.length === 0) {
      const now = new Date().toISOString();
      const defaultProfile: Profile = {
        id: DEFAULT_PROFILE_ID,
        name: DEFAULT_PROFILE_NAME,
        createdAt: now,
        updatedAt: now,
        streak: {
          currentStreak: 0,
          bestStreak: 0,
          lastActiveDate: null,
          activityHistory: [],
        },
        gamification: {
          xp: 0,
        },
      };
      await this.adapter.saveProfile(defaultProfile);
      await this.adapter.setActiveProfileId(defaultProfile.id);
      return defaultProfile;
    }

    let activeId = await this.adapter.getActiveProfileId();
    if (!activeId || !profiles.some((p) => p.id === activeId)) {
      activeId = profiles[0]!.id;
      await this.adapter.setActiveProfileId(activeId);
    }

    const activeProfile = profiles.find((p) => p.id === activeId) ?? profiles[0]!;
    return ensureProfileDefaults(activeProfile);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  // --- Profile Management ---

  async getProfiles(): Promise<Profile[]> {
    await this.ensureInitialized();
    const list = await this.adapter.getProfiles();
    return list.map(ensureProfileDefaults);
  }

  async getActiveProfile(): Promise<Profile> {
    await this.ensureInitialized();
    const activeId = await this.adapter.getActiveProfileId();
    const profiles = await this.adapter.getProfiles();

    if (activeId) {
      const found = profiles.find((p) => p.id === activeId);
      if (found) return ensureProfileDefaults(found);
    }

    if (profiles.length > 0) {
      const first = profiles[0]!;
      await this.adapter.setActiveProfileId(first.id);
      return ensureProfileDefaults(first);
    }

    return this.init();
  }

  async setActiveProfile(id: string): Promise<void> {
    await this.ensureInitialized();
    const profile = await this.adapter.getProfile(id);
    if (!profile) {
      throw new Error(`Perfil com ID "${id}" não encontrado.`);
    }
    await this.adapter.setActiveProfileId(id);
  }

  async createProfile(name: string): Promise<Profile> {
    await this.ensureInitialized();
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('O nome do perfil não pode estar vazio.');
    }

    const now = new Date().toISOString();
    const id = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newProfile: Profile = {
      id,
      name: trimmed,
      createdAt: now,
      updatedAt: now,
      streak: {
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: null,
        activityHistory: [],
      },
      gamification: {
        xp: 0,
      },
    };

    await this.adapter.saveProfile(newProfile);
    return newProfile;
  }

  async deleteProfile(id: string): Promise<void> {
    await this.ensureInitialized();
    const profiles = await this.adapter.getProfiles();
    if (profiles.length <= 1) {
      throw new Error('Não é possível excluir o único perfil existente.');
    }

    await this.adapter.deleteProfile(id);

    const activeId = await this.adapter.getActiveProfileId();
    if (!activeId || activeId === id) {
      const remaining = await this.adapter.getProfiles();
      if (remaining.length > 0) {
        await this.adapter.setActiveProfileId(remaining[0]!.id);
      }
    }
  }

  /**
   * Records daily activity, recalculates streak and increments XP.
   */
  async recordDailyActivity(params: RecordDailyActivityParams = {}): Promise<Profile> {
    await this.ensureInitialized();
    const profileId = params.profileId || (await this.getActiveProfile()).id;
    const rawProfile = await this.adapter.getProfile(profileId);
    if (!rawProfile) {
      throw new Error(`Perfil com ID "${profileId}" não encontrado.`);
    }

    const profile = ensureProfileDefaults(rawProfile);
    const activityDate = params.date || getLocalDateString();
    const updatedStreak = updateStreakAndActivity(profile.streak, activityDate);

    const xpEarned = params.xpEarned ?? 0;
    const updatedGamification = {
      xp: (profile.gamification?.xp ?? 0) + xpEarned,
    };

    const updatedProfile: Profile = {
      ...profile,
      updatedAt: new Date().toISOString(),
      streak: updatedStreak,
      gamification: updatedGamification,
    };

    await this.adapter.saveProfile(updatedProfile);
    return updatedProfile;
  }

  // --- Progress Management ---

  async recordAttempt(params: RecordAttemptParams): Promise<ExerciseProgress> {
    await this.ensureInitialized();
    const profileId = params.profileId || (await this.getActiveProfile()).id;

    const existing = await this.adapter.getProgress(profileId, params.exerciseId);
    const now = new Date().toISOString();
    const isSuccess = params.isSuccess || params.status === 'correct';

    const attemptRecord: ExerciseAttemptRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      exerciseId: params.exerciseId,
      trackId: params.trackId,
      moduleId: params.moduleId,
      timestamp: now,
      code: params.code,
      status: params.status,
      isSuccess,
      executionTimeMs: params.executionTimeMs,
      hintsViewed: params.hintsViewed,
    };

    const isNewlyCompleted = isSuccess && (!existing || !existing.completed);
    const completed = (existing?.completed ?? false) || isSuccess;

    const firstCompletedAt = isNewlyCompleted
      ? now
      : (existing?.firstCompletedAt ?? (completed ? now : null));

    const attemptsCount = (existing?.attemptsCount ?? 0) + 1;
    const successfulAttemptsCount =
      (existing?.successfulAttemptsCount ?? 0) + (isSuccess ? 1 : 0);
    const history = [...(existing?.history ?? []), attemptRecord];

    const updatedProgress: ExerciseProgress = {
      profileId,
      exerciseId: params.exerciseId,
      trackId: params.trackId,
      moduleId: params.moduleId,
      completed,
      firstCompletedAt,
      lastAttemptAt: now,
      attemptsCount,
      successfulAttemptsCount,
      lastCode: params.code,
      history,
    };

    await this.adapter.saveProgress(updatedProgress);

    // Se o exercício foi resolvido com sucesso, registra atividade diária e premia com XP (+50 XP)
    if (isSuccess) {
      await this.recordDailyActivity({ profileId, xpEarned: 50 });
    }

    return updatedProgress;
  }

  async getProgress(exerciseId: string, profileId?: string): Promise<ExerciseProgress | null> {
    await this.ensureInitialized();
    const targetProfileId = profileId || (await this.getActiveProfile()).id;
    return this.adapter.getProgress(targetProfileId, exerciseId);
  }

  async getAllProgress(profileId?: string): Promise<ExerciseProgress[]> {
    await this.ensureInitialized();
    const targetProfileId = profileId || (await this.getActiveProfile()).id;
    return this.adapter.getAllProgress(targetProfileId);
  }

  async getStats(exercises: ExerciseMeta[], profileId?: string): Promise<OverallStats> {
    const progressList = await this.getAllProgress(profileId);
    return calculateProgressStats(exercises, progressList);
  }

  // --- Export & Import ---

  async exportData(profileId?: string): Promise<ProgressExportData> {
    await this.ensureInitialized();
    let profiles: Profile[] = [];
    let progress: ExerciseProgress[] = [];

    if (profileId) {
      const p = await this.adapter.getProfile(profileId);
      if (p) profiles = [p];
      progress = await this.adapter.getAllProgress(profileId);
    } else {
      profiles = await this.adapter.getProfiles();
      for (const p of profiles) {
        const pProg = await this.adapter.getAllProgress(p.id);
        progress.push(...pProg);
      }
    }

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      profiles,
      progress,
    };
  }

  async exportDataAsJson(profileId?: string): Promise<string> {
    const data = await this.exportData(profileId);
    return JSON.stringify(data, null, 2);
  }

  async importData(
    raw: unknown
  ): Promise<{ profilesCount: number; progressCount: number }> {
    await this.ensureInitialized();
    const validated = validateImportPayload(raw);

    // Get current all data
    const allProfiles = await this.adapter.getProfiles();
    const allProgress: ExerciseProgress[] = [];
    for (const p of allProfiles) {
      const pProg = await this.adapter.getAllProgress(p.id);
      allProgress.push(...pProg);
    }

    // Smart merge
    const merged = mergeDatasets(
      { profiles: allProfiles, progress: allProgress },
      validated
    );

    // Save merged profiles
    for (const p of merged.profiles) {
      await this.adapter.saveProfile(p);
    }

    // Save merged progress
    for (const pr of merged.progress) {
      await this.adapter.saveProgress(pr);
    }

    return {
      profilesCount: merged.profiles.length,
      progressCount: merged.progress.length,
    };
  }

  async importDataFromJson(
    jsonString: string
  ): Promise<{ profilesCount: number; progressCount: number }> {
    return this.importData(jsonString);
  }
}
