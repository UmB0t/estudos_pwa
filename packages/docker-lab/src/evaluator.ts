import type { Exercise, EvaluationResult } from '@lab/shared';
import { DockerState, DockerSession, type DockerExecutionResult } from './docker';

export interface DockerEvaluatorContext {
  exercise: Exercise;
  baseState?: DockerState;
}

export class DockerEvaluator {
  public async evaluate(context: DockerEvaluatorContext, studentInput: string): Promise<EvaluationResult> {
    const { exercise, baseState } = context;
    const trimmedInput = studentInput.trim();

    if (!trimmedInput) {
      return {
        status: 'wrong',
        message: 'Nenhum comando docker foi informado. Digite um comando para praticar.',
      };
    }

    const initialState = baseState ? baseState.clone() : new DockerState();
    if (exercise.setup) {
      const setupSession = new DockerSession(initialState);
      const setupLines = exercise.setup.split('\n');
      for (const line of setupLines) {
        if (line.trim()) {
          setupSession.execute(line.trim());
        }
      }
    }

    // Execução do aluno
    const studentState = initialState.clone();
    const studentSession = new DockerSession(studentState);
    let studentResult: DockerExecutionResult = { stdout: '', stderr: '', exitCode: 0 };

    const cmdLines = trimmedInput.split('\n');
    for (const line of cmdLines) {
      if (line.trim()) {
        studentResult = studentSession.execute(line.trim());
        if (studentResult.exitCode !== 0) break;
      }
    }

    if (studentResult.exitCode !== 0) {
      return {
        status: 'wrong',
        message: studentResult.stderr.trim() || 'O comando docker retornou um código de erro.',
        output: studentResult.stdout,
        error: studentResult.stderr,
      };
    }

    // Comparação contra soluções
    for (const sol of exercise.solutions) {
      const solState = initialState.clone();
      const solSession = new DockerSession(solState);
      let solResult: DockerExecutionResult = { stdout: '', stderr: '', exitCode: 0 };

      const solLines = sol.trim().split('\n');
      for (const line of solLines) {
        if (line.trim()) {
          solResult = solSession.execute(line.trim());
        }
      }

      const cleanCmd = (c: string) => c.replace(/\s+/g, ' ').trim();
      const matchesCommand = cleanCmd(trimmedInput) === cleanCmd(sol);

      // Verificação de containers criados ou modificados
      const containersMatch =
        studentState.containers.length === solState.containers.length &&
        studentState.containers.every((sc, idx) => {
          const tc = solState.containers[idx];
          if (!tc) return false;
          return sc.image === tc.image && (sc.status.split(' ')[0] ?? '') === (tc.status.split(' ')[0] ?? '');
        });

      // Verificação de saída (quando aplicável)
      const normStudentOut = studentResult.stdout.trim().replace(/\s+/g, ' ');
      const normSolOut = solResult.stdout.trim().replace(/\s+/g, ' ');
      const outputMatch = normSolOut.length > 0 && (normStudentOut === normSolOut || normStudentOut.includes('CONTAINER ID'));

      if (matchesCommand || (containersMatch && studentResult.exitCode === 0) || outputMatch) {
        return {
          status: 'correct',
          message: 'Excelente! Comando Docker executado e estado do ambiente validado com sucesso.',
          output: studentResult.stdout,
        };
      }
    }

    return {
      status: 'wrong',
      message: 'Comando executado, mas não produziu o resultado Docker esperado pelo exercício.',
      output: studentResult.stdout,
    };
  }
}
