import type { EvaluationResult } from '@lab/shared';

export type AppView = 'home' | 'exercise' | 'reference';

export interface ExerciseState {
  code: string;
  hintsRevealed: number;
  showSolution: boolean;
  evaluation: EvaluationResult | null;
  isEvaluating: boolean;
}

export type EngineStatus = 'idle' | 'initializing' | 'ready' | 'running' | 'error';
