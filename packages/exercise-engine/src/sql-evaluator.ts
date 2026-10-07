import type { EvaluationResult, Exercise } from '@lab/shared';
import { createInProcessSqlSession, type ISqlEngine } from '@lab/sql-engine';
import { compareResultSets, type ComparisonOutcome } from './comparator';
import type { Evaluator } from './evaluator';

export interface SqlEvaluatorContext {
  exercise: Exercise;
  datasetSql?: string;
  sqlEngine?: ISqlEngine;
}

export class SqlEvaluator implements Evaluator<SqlEvaluatorContext, string, EvaluationResult> {
  async evaluate(context: SqlEvaluatorContext, studentSql: string): Promise<EvaluationResult> {
    const { exercise, datasetSql, sqlEngine } = context;

    // Se uma engine já foi fornecida, utiliza-a; caso contrário, cria uma sessão isolada
    const shouldCloseEngine = !sqlEngine;
    const engine: ISqlEngine =
      sqlEngine ?? (await createInProcessSqlSession(datasetSql, exercise.setup));

    try {
      // 1. Executa a query do aluno
      const studentExec = await engine.query(studentSql);

      // Se a execução do aluno falhou (erro de sintaxe, coluna/tabela inexistente, mutação bloqueada, etc.)
      if (!studentExec.success) {
        return {
          status: 'wrong',
          message: studentExec.error,
          error: studentExec.details,
        };
      }

      const studentResult = studentExec.result;

      // 2. Executa cada uma das soluções e compara com o resultado do aluno
      const outcomes: ComparisonOutcome[] = [];

      for (const solutionSql of exercise.solutions) {
        const solExec = await engine.query(solutionSql);
        if (!solExec.success) {
          // Solução do exercício falhou (não deve ocorrer se o exercício for válido)
          continue;
        }

        const outcome = compareResultSets(studentResult, solExec.result, exercise.orderMatters);
        outcomes.push(outcome);

        // Se encontrou acerto perfeito (correct), não precisa buscar outras alternativas
        if (outcome.status === 'correct') {
          return {
            status: 'correct',
            message: outcome.message,
            studentResult,
          };
        }
      }

      if (outcomes.length === 0) {
        return {
          status: 'wrong',
          message: 'Nenhuma solução válida pôde ser executada para comparar este exercício.',
          studentResult,
        };
      }

      // 3. Hierarquia Best-Match: correct > almost > wrong
      // Se houver mais de um almost ou wrong, seleciona o de menor penaltyScore (mais similar)
      const almostOutcomes = outcomes.filter((o) => o.status === 'almost');
      if (almostOutcomes.length > 0) {
        almostOutcomes.sort((a, b) => a.penaltyScore - b.penaltyScore);
        const bestAlmost = almostOutcomes[0]!;
        return {
          status: 'almost',
          message: bestAlmost.message,
          studentResult,
        };
      }

      // Se todos forem wrong, pega o com menor penaltyScore (diagnóstico mais detalhado)
      outcomes.sort((a, b) => a.penaltyScore - b.penaltyScore);
      const bestWrong = outcomes[0]!;

      return {
        status: 'wrong',
        message: bestWrong.message,
        studentResult,
      };
    } finally {
      if (shouldCloseEngine) {
        await engine.close();
      }
    }
  }
}
