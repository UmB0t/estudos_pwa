import type { Exercise, EvaluationResult } from '@lab/shared';
import { VFS, type VfsSnapshot } from './vfs';
import { LinuxSession, type ShellExecutionResult } from './shell';

export interface LinuxEvaluatorContext {
  exercise: Exercise;
  baseVfs?: VFS;
}

/**
 * Normaliza saída textual removendo espaços em branco supérfluos no início/fim de cada linha.
 */
function normalizeOutput(out: string): string {
  return out
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/**
 * Compara dois snapshots de VFS. Retorna true se forem estruturalmente e textualmente idênticos.
 */
function compareSnapshots(a: VfsSnapshot, b: VfsSnapshot): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const keyA = keysA[i];
    const keyB = keysB[i];
    if (!keyA || !keyB || keyA !== keyB) return false;

    const entryA = a[keyA];
    const entryB = b[keyB];
    if (!entryA || !entryB) return false;

    if (entryA.type !== entryB.type) return false;
    if (entryA.type === 'file') {
      if ((entryA.content ?? '') !== (entryB.content ?? '')) return false;
    }
  }

  return true;
}

/**
 * Avaliador de Exercícios do Linux Shell baseado em estado de VFS e saída padrão.
 */
export class LinuxEvaluator {
  public async evaluate(context: LinuxEvaluatorContext, studentInput: string): Promise<EvaluationResult> {
    const { exercise, baseVfs } = context;
    const trimmedInput = studentInput.trim();

    if (!trimmedInput) {
      return {
        status: 'wrong',
        message: 'Nenhum comando foi inserido. Digite um comando bash para praticar.',
      };
    }

    // 1. Inicializar VFS com setup do exercício
    const initialVfs = baseVfs ? baseVfs.clone() : new VFS();
    if (exercise.setup) {
      const setupSession = new LinuxSession(initialVfs);
      const setupLines = exercise.setup.split('\n');
      for (const line of setupLines) {
        if (line.trim()) {
          setupSession.execute(line.trim());
        }
      }
    }

    // 2. Executar comandos do aluno
    const studentVfs = initialVfs.clone();
    const studentSession = new LinuxSession(studentVfs);

    let studentResult: ShellExecutionResult = { stdout: '', stderr: '', exitCode: 0, cwd: studentSession.cwd };
    const commandLines = trimmedInput.split('\n');
    for (const line of commandLines) {
      if (line.trim()) {
        studentResult = studentSession.execute(line.trim());
        if (studentResult.exitCode !== 0) {
          break;
        }
      }
    }

    // Se houve erro de execução no shell
    if (studentResult.exitCode !== 0) {
      return {
        status: 'wrong',
        message: studentResult.stderr.trim() || 'O comando finalizou com código de erro.',
        output: studentResult.stdout,
        error: studentResult.stderr,
      };
    }

    // 3. Comparar contra cada solução oficial
    for (const sol of exercise.solutions) {
      const solVfs = initialVfs.clone();
      const solSession = new LinuxSession(solVfs);

      let solResult: ShellExecutionResult = { stdout: '', stderr: '', exitCode: 0, cwd: solSession.cwd };
      const solLines = sol.trim().split('\n');
      for (const line of solLines) {
        if (line.trim()) {
          solResult = solSession.execute(line.trim());
        }
      }

      // Comparação 1: Verificação de saída textual normalizada (para comandos de leitura: pwd, ls, cat, grep)
      const normStudentOut = normalizeOutput(studentResult.stdout);
      const normSolOut = normalizeOutput(solResult.stdout);
      const outputMatches = normSolOut.length > 0 && normStudentOut === normSolOut;

      // Comparação 2: Verificação de estado final do sistema de arquivos (VFS) e diretório atual
      const studentSnap = studentVfs.snapshot();
      const solSnap = solVfs.snapshot();
      const vfsMatches = compareSnapshots(studentSnap, solSnap);
      const cwdMatches = studentSession.cwd === solSession.cwd;

      // Comparação 3: Equivalência de comando literal ou simplificado
      const cleanCmd = (cmd: string) => cmd.replace(/\s+/g, ' ').trim();
      const commandMatches = cleanCmd(trimmedInput) === cleanCmd(sol);

      if ((vfsMatches && cwdMatches && (normSolOut.length === 0 || outputMatches)) || outputMatches || commandMatches) {
        return {
          status: 'correct',
          message: 'Excelente! Comando executado com sucesso e o estado do sistema está correto.',
          output: studentResult.stdout,
        };
      }
    }

    // Caso não tenha casado exatamente
    return {
      status: 'wrong',
      message:
        'O comando executou, mas o resultado ou estado do sistema não corresponde ao solicitado no enunciado. Tente novamente ou revise as dicas.',
      output: studentResult.stdout,
    };
  }
}
