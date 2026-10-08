import type { EvaluationResult } from '@lab/shared';

export type AppView =
  | 'dashboard'
  | 'lesson'
  | 'tracks'
  | 'review'
  | 'ranking'
  | 'home'
  | 'exercise'
  | 'reference';

export interface ExerciseState {
  code: string;
  hintsRevealed: number;
  showSolution: boolean;
  evaluation: EvaluationResult | null;
  isEvaluating: boolean;
}

export type EngineStatus = 'idle' | 'initializing' | 'ready' | 'running' | 'error';
