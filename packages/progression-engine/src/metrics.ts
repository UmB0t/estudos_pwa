import type { ExerciseProgress, OverallStats, TrackStats } from './types.js';

export interface ExerciseMeta {
  id: string;
  trackId: string;
  moduleId: string;
}

/**
 * Calculates aggregated progress statistics across tracks, modules, and overall.
 */
export function calculateProgressStats(
  exercises: ExerciseMeta[],
  progressList: ExerciseProgress[]
): OverallStats {
  const progressMap = new Map<string, ExerciseProgress>();
  for (const p of progressList) {
    progressMap.set(p.exerciseId, p);
  }

  const tracks: Record<string, TrackStats> = {};
  let overallCompleted = 0;
  let overallAttempts = 0;

  for (const ex of exercises) {
    if (!tracks[ex.trackId]) {
      tracks[ex.trackId] = {
        trackId: ex.trackId,
        totalExercises: 0,
        completedExercises: 0,
        completionPercentage: 0,
        totalAttempts: 0,
        modules: {},
      };
    }
    const track = tracks[ex.trackId]!;

    if (!track.modules[ex.moduleId]) {
      track.modules[ex.moduleId] = {
        moduleId: ex.moduleId,
        totalExercises: 0,
        completedExercises: 0,
        completionPercentage: 0,
        totalAttempts: 0,
      };
    }
    const mod = track.modules[ex.moduleId]!;

    track.totalExercises += 1;
    mod.totalExercises += 1;

    const prog = progressMap.get(ex.id);
    if (prog) {
      if (prog.completed) {
        track.completedExercises += 1;
        mod.completedExercises += 1;
        overallCompleted += 1;
      }
      track.totalAttempts += prog.attemptsCount;
      mod.totalAttempts += prog.attemptsCount;
      overallAttempts += prog.attemptsCount;
    }
  }

  // Calculate percentages
  for (const track of Object.values(tracks)) {
    track.completionPercentage =
      track.totalExercises > 0
        ? Math.round((track.completedExercises / track.totalExercises) * 100)
        : 0;

    for (const mod of Object.values(track.modules)) {
      mod.completionPercentage =
        mod.totalExercises > 0
          ? Math.round((mod.completedExercises / mod.totalExercises) * 100)
          : 0;
    }
  }

  const totalExercises = exercises.length;
  const overallPercentage =
    totalExercises > 0
      ? Math.round((overallCompleted / totalExercises) * 100)
      : 0;

  return {
    totalExercises,
    completedExercises: overallCompleted,
    completionPercentage: overallPercentage,
    totalAttempts: overallAttempts,
    tracks,
  };
}

/**
 * Returns summary status for a specific exercise.
 */
export function getExerciseStatus(
  exerciseId: string,
  progressList: ExerciseProgress[]
): { completed: boolean; attemptsCount: number; lastCode?: string } {
  const found = progressList.find((p) => p.exerciseId === exerciseId);
  if (!found) {
    return { completed: false, attemptsCount: 0 };
  }
  return {
    completed: found.completed,
    attemptsCount: found.attemptsCount,
    lastCode: found.lastCode,
  };
}
