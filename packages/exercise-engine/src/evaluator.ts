import type { EvaluationResult } from '@lab/shared';

/**
 * Interface genérica para motores de avaliação de qualquer trilha (SQL, Linux, Docker, Redes).
 */
export interface Evaluator<TContext, TInput, TResult = EvaluationResult> {
  evaluate(context: TContext, input: TInput): Promise<TResult>;
}
