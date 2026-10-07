import {
  type ExerciseAttemptRecord,
  type ExerciseProgress,
  type Profile,
  type ProgressExportData,
  ProgressExportDataSchema,
} from './types.js';

export class ProgressValidationError extends Error {
  constructor(message: string, public readonly issues?: unknown) {
    super(message);
    this.name = 'ProgressValidationError';
  }
}

/**
 * Validates raw data or JSON string against the strict ProgressExportDataSchema.
 */
export function validateImportPayload(raw: unknown): ProgressExportData {
  let parsedJson = raw;
  if (typeof raw === 'string') {
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      throw new ProgressValidationError('Arquivo corrompido: o conteúdo não é um JSON válido.');
    }
  }

  const result = ProgressExportDataSchema.safeParse(parsedJson);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((i) => `${i.path.join('.') || 'raiz'}: ${i.message}`)
      .join('; ');
    throw new ProgressValidationError(
      `Estrutura de dados de progresso inválida: ${errorDetails}`,
      result.error.issues
    );
  }

  return result.data;
}

/**
 * Merges two lists of attempts without duplicates, sorted chronologically.
 */
function mergeAttemptHistories(
  existingHistory: ExerciseAttemptRecord[] = [],
  importedHistory: ExerciseAttemptRecord[] = []
): ExerciseAttemptRecord[] {
  const seen = new Set<string>();
  const merged: ExerciseAttemptRecord[] = [];

  for (const item of [...existingHistory, ...importedHistory]) {
    // Deduplicate by ID or (timestamp + code)
    const key = item.id ? `id:${item.id}` : `ts:${item.timestamp}:${item.code}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }

  // Sort ascending by timestamp
  return merged.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Intelligently merges an imported ExerciseProgress into an existing ExerciseProgress record.
 * GUARANTEES:
 * 1. Status 'completed' is strictly preserved if either had completed = true.
 * 2. Attempts history is unified, deduplicated and sorted chronologically.
 * 3. firstCompletedAt preserves the earliest completion timestamp.
 * 4. lastAttemptAt and lastCode reflect the most recent attempt.
 */
export function mergeExerciseProgress(
  existing: ExerciseProgress,
  imported: ExerciseProgress
): ExerciseProgress {
  const isCompleted = existing.completed || imported.completed;

  // Find earliest firstCompletedAt
  const completionDates: number[] = [];
  if (existing.firstCompletedAt) {
    const t = new Date(existing.firstCompletedAt).getTime();
    if (!Number.isNaN(t)) completionDates.push(t);
  }
  if (imported.firstCompletedAt) {
    const t = new Date(imported.firstCompletedAt).getTime();
    if (!Number.isNaN(t)) completionDates.push(t);
  }

  let mergedFirstCompletedAt: string | null = null;
  if (completionDates.length > 0) {
    mergedFirstCompletedAt = new Date(Math.min(...completionDates)).toISOString();
  } else if (isCompleted) {
    mergedFirstCompletedAt = existing.firstCompletedAt ?? imported.firstCompletedAt ?? new Date().toISOString();
  }

  const mergedHistory = mergeAttemptHistories(existing.history, imported.history);

  // Latest attempt time
  const existingTime = new Date(existing.lastAttemptAt).getTime() || 0;
  const importedTime = new Date(imported.lastAttemptAt).getTime() || 0;
  const lastHistoryTime =
    mergedHistory.length > 0
      ? new Date(mergedHistory[mergedHistory.length - 1]!.timestamp).getTime()
      : 0;

  const maxTime = Math.max(existingTime, importedTime, lastHistoryTime);
  const lastAttemptAt =
    maxTime > 0 ? new Date(maxTime).toISOString() : existing.lastAttemptAt || imported.lastAttemptAt;

  // Last code used
  let lastCode = existing.lastCode;
  if (mergedHistory.length > 0) {
    lastCode = mergedHistory[mergedHistory.length - 1]!.code;
  } else if (importedTime >= existingTime && imported.lastCode) {
    lastCode = imported.lastCode;
  }

  const attemptsCount = Math.max(
    mergedHistory.length,
    existing.attemptsCount + imported.attemptsCount,
    existing.attemptsCount,
    imported.attemptsCount
  );

  const successfulAttemptsCount = mergedHistory.length > 0
    ? mergedHistory.filter((a) => a.isSuccess || a.status === 'correct').length
    : Math.max(existing.successfulAttemptsCount, imported.successfulAttemptsCount);

  return {
    profileId: existing.profileId,
    exerciseId: existing.exerciseId,
    trackId: existing.trackId || imported.trackId,
    moduleId: existing.moduleId || imported.moduleId,
    completed: isCompleted,
    firstCompletedAt: mergedFirstCompletedAt,
    lastAttemptAt,
    attemptsCount,
    successfulAttemptsCount,
    lastCode,
    history: mergedHistory,
  };
}

/**
 * Merges imported profiles and progress into an existing dataset.
 */
export function mergeDatasets(
  current: { profiles: Profile[]; progress: ExerciseProgress[] },
  imported: ProgressExportData
): { profiles: Profile[]; progress: ExerciseProgress[] } {
  // 1. Merge Profiles
  const profileMap = new Map<string, Profile>();
  for (const p of current.profiles) {
    profileMap.set(p.id, { ...p });
  }

  for (const p of imported.profiles) {
    const existing = profileMap.get(p.id);
    if (!existing) {
      profileMap.set(p.id, { ...p });
    } else {
      // Profile exists: preserve createdAt, update updatedAt if newer
      const existingUpdated = new Date(existing.updatedAt).getTime() || 0;
      const importedUpdated = new Date(p.updatedAt).getTime() || 0;
      if (importedUpdated > existingUpdated) {
        profileMap.set(p.id, {
          ...existing,
          name: p.name || existing.name,
          updatedAt: p.updatedAt,
        });
      }
    }
  }

  // 2. Merge Progress
  const progressKey = (profileId: string, exerciseId: string) => `${profileId}::${exerciseId}`;
  const progressMap = new Map<string, ExerciseProgress>();

  for (const pr of current.progress) {
    progressMap.set(progressKey(pr.profileId, pr.exerciseId), { ...pr });
  }

  for (const importedPr of imported.progress) {
    const key = progressKey(importedPr.profileId, importedPr.exerciseId);
    const existingPr = progressMap.get(key);

    if (!existingPr) {
      progressMap.set(key, { ...importedPr });
    } else {
      const merged = mergeExerciseProgress(existingPr, importedPr);
      progressMap.set(key, merged);
    }
  }

  return {
    profiles: Array.from(profileMap.values()),
    progress: Array.from(progressMap.values()),
  };
}
