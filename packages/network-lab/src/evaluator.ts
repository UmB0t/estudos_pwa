import type { Exercise, EvaluationResult } from '@lab/shared';
import { NetworkState, NetworkSession, type NetworkExecutionResult } from './network';

export interface NetworkEvaluatorContext {
  exercise: Exercise;
  baseState?: NetworkState;
}

export class NetworkEvaluator {
  public async evaluate(context: NetworkEvaluatorContext, studentInput: string): Promise<EvaluationResult> {
    const { exercise, baseState } = context;
    const trimmedInput = studentInput.trim();

    if (!trimmedInput) {
      return {
        status: 'wrong',
        message: 'Nenhum comando de rede informado. Digite um comando para praticar.',
      };
    }

    const state = baseState ? baseState.clone() : new NetworkState();
    const session = new NetworkSession(state);

    let studentResult: NetworkExecutionResult = { stdout: '', stderr: '', exitCode: 0 };
    const lines = trimmedInput.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        studentResult = session.execute(line.trim());
        if (studentResult.exitCode !== 0) break;
      }
    }

    if (studentResult.exitCode !== 0) {
      return {
        status: 'wrong',
        message: studentResult.stderr.trim() || studentResult.stdout.trim() || 'Comando finalizou com erro de rede.',
        output: studentResult.stdout,
        error: studentResult.stderr,
      };
    }

    // Compara com cada solução
    for (const sol of exercise.solutions) {
      const cleanCmd = (c: string) => c.replace(/\s+/g, ' ').trim();
      if (cleanCmd(trimmedInput) === cleanCmd(sol)) {
        return {
          status: 'correct',
          message: 'Parabéns! Diagnóstico de rede executado com sucesso.',
          output: studentResult.stdout,
        };
      }

      // Executa a solução para comparar saída
      const solSession = new NetworkSession(state.clone());
      const solResult = solSession.execute(sol.trim());

      const normStudent = studentResult.stdout.trim().replace(/\s+/g, ' ');
      const normSol = solResult.stdout.trim().replace(/\s+/g, ' ');

      if (normSol.length > 0 && normStudent === normSol) {
        return {
          status: 'correct',
          message: 'Parabéns! Diagnóstico de rede executado com sucesso.',
          output: studentResult.stdout,
        };
      }
    }

    return {
      status: 'wrong',
      message: 'Comando executado, mas a saída não corresponde ao diagnóstico esperado. Tente novamente.',
      output: studentResult.stdout,
    };
  }
}
