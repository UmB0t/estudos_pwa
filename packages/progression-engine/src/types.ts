import { z } from 'zod';

export const StreakDataSchema = z.object({
  currentStreak: z.number().int().nonnegative().default(0),
  bestStreak: z.number().int().nonnegative().default(0),
  lastActiveDate: z.string().nullable().optional(),
  activityHistory: z.array(z.string()).default([]),
});
export type StreakData = z.infer<typeof StreakDataSchema>;

export const GamificationSchema = z.object({
  xp: z.number().int().nonnegative().default(0),
});
export type Gamification = z.infer<typeof GamificationSchema>;

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  avatarUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  streak: StreakDataSchema.optional(),
  gamification: GamificationSchema.optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Profile = UserProfile;
export const ProfileSchema = UserProfileSchema;

export const ExerciseAttemptRecordSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  trackId: z.string().min(1),
  moduleId: z.string().min(1),
  timestamp: z.string(),
  code: z.string(),
  status: z.enum(['correct', 'almost', 'wrong', 'error']),
  isSuccess: z.boolean(),
  executionTimeMs: z.number().optional(),
  hintsViewed: z.number().optional(),
});
export type ExerciseAttemptRecord = z.infer<typeof ExerciseAttemptRecordSchema>;

export const ExerciseProgressSchema = z.object({
  profileId: z.string().min(1),
  exerciseId: z.string().min(1),
  trackId: z.string().min(1),
  moduleId: z.string().min(1),
  completed: z.boolean(),
  firstCompletedAt: z.string().nullable().optional(),
  lastAttemptAt: z.string(),
  attemptsCount: z.number().int().nonnegative(),
  successfulAttemptsCount: z.number().int().nonnegative(),
  lastCode: z.string(),
  history: z.array(ExerciseAttemptRecordSchema).default([]),
});
export type ExerciseProgress = z.infer<typeof ExerciseProgressSchema>;

export const ProgressExportDataSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  profiles: z.array(ProfileSchema),
  progress: z.array(ExerciseProgressSchema),
});
export type ProgressExportData = z.infer<typeof ProgressExportDataSchema>;

export interface ModuleStats {
  moduleId: string;
  totalExercises: number;
  completedExercises: number;
  completionPercentage: number;
  totalAttempts: number;
}

export interface TrackStats {
  trackId: string;
  totalExercises: number;
  completedExercises: number;
  completionPercentage: number;
  totalAttempts: number;
  modules: Record<string, ModuleStats>;
}

export interface OverallStats {
  totalExercises: number;
  completedExercises: number;
  completionPercentage: number;
  totalAttempts: number;
  tracks: Record<string, TrackStats>;
}
