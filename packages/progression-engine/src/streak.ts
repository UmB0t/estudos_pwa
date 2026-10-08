import type { StreakData, Profile } from './types.js';

/**
 * Returns the local date in YYYY-MM-DD format.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD date strings.
 * Returns >0 if toDateStr is in the future compared to fromDateStr,
 * 0 if same day, <0 if toDateStr is earlier.
 */
export function calculateDateDiffInDays(fromDateStr: string, toDateStr: string): number {
  const [y1, m1, d1] = fromDateStr.split('-').map(Number);
  const [y2, m2, d2] = toDateStr.split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) {
    return 0;
  }
  const utcFoo1 = Date.UTC(y1, m1 - 1, d1);
  const utcFoo2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utcFoo2 - utcFoo1) / msPerDay);
}

/**
 * Ensures a profile has all default streak and gamification structures initialized.
 */
export function ensureProfileDefaults(profile: Profile): Profile & {
  streak: StreakData;
  gamification: { xp: number };
} {
  return {
    ...profile,
    streak: {
      currentStreak: profile.streak?.currentStreak ?? 0,
      bestStreak: profile.streak?.bestStreak ?? 0,
      lastActiveDate: profile.streak?.lastActiveDate ?? null,
      activityHistory: profile.streak?.activityHistory ? [...profile.streak.activityHistory] : [],
    },
    gamification: {
      xp: profile.gamification?.xp ?? 0,
    },
  };
}

/**
 * Computes the updated streak state given a target activity date.
 * Rules:
 * - Local date is recorded in activityHistory (deduplicated and sorted).
 * - If lastActiveDate is null/empty: currentStreak = 1, bestStreak = max(bestStreak, 1).
 * - If diff === 0 (same day): maintains current streak.
 * - If diff === 1 (exactly 1 day after): currentStreak += 1, bestStreak = max(bestStreak, currentStreak).
 * - If diff > 1 (gap of more than 1 day): currentStreak = 1 (restarts), bestStreak is preserved.
 * - If diff < 0 (activity on earlier date): streak is untouched, only activityHistory is updated.
 */
export function updateStreakAndActivity(
  streak: StreakData | undefined,
  activityDate: string = getLocalDateString()
): StreakData {
  const current: StreakData = {
    currentStreak: streak?.currentStreak ?? 0,
    bestStreak: streak?.bestStreak ?? 0,
    lastActiveDate: streak?.lastActiveDate ?? null,
    activityHistory: streak?.activityHistory ? [...streak.activityHistory] : [],
  };

  if (!current.activityHistory.includes(activityDate)) {
    current.activityHistory.push(activityDate);
    current.activityHistory.sort();
  }

  if (!current.lastActiveDate) {
    current.currentStreak = 1;
    current.bestStreak = Math.max(current.bestStreak, 1);
    current.lastActiveDate = activityDate;
    return current;
  }

  const diff = calculateDateDiffInDays(current.lastActiveDate, activityDate);

  if (diff === 0) {
    // Mesmo dia: mantém sequência atual (se for 0, torna 1)
    if (current.currentStreak === 0) {
      current.currentStreak = 1;
    }
    current.bestStreak = Math.max(current.bestStreak, current.currentStreak);
  } else if (diff === 1) {
    // Exatamente 1 dia após: incrementa sequência
    current.currentStreak += 1;
    current.bestStreak = Math.max(current.bestStreak, current.currentStreak);
    current.lastActiveDate = activityDate;
  } else if (diff > 1) {
    // Mais de 1 dia: quebrou sequência, reinicia para 1
    current.currentStreak = 1;
    current.bestStreak = Math.max(current.bestStreak, 1);
    current.lastActiveDate = activityDate;
  }
  // Se diff < 0: atividade de data retroativa, não altera lastActiveDate nem streak corrente

  return current;
}
