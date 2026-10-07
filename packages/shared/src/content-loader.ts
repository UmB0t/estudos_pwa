import { ExerciseSchema, toPublicExercise, type Exercise, type PublicExercise } from './exercise';

export { toPublicExercise, type PublicExercise };

export interface ParseExerciseError {
  filePath?: string;
  exerciseId?: string;
  field: string;
  message: string;
}

/**
 * Valida e converte um objeto de dados brutos em um Exercise tipado e válido.
 * Lança um erro detalhado caso o conteúdo não esteja em conformidade com o ExerciseSchema.
 */
export function parseExercise(data: unknown, sourceFile?: string): Exercise {
  const result = ExerciseSchema.safeParse(data);

  if (!result.success) {
    const rawObj = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
    const id = typeof rawObj.id === 'string' ? rawObj.id : undefined;
    const origin = sourceFile ?? id ?? 'exercício desconhecido';

    const formattedIssues = result.error.issues
      .map((issue) => {
        const fieldPath = issue.path.join('.') || 'raiz';
        return `  • campo '${fieldPath}': ${issue.message}`;
      })
      .join('\n');

    throw new Error(`Falha na validação do exercício em "${origin}":\n${formattedIssues}`);
  }

  return result.data;
}

/**
 * Converte um dicionário de arquivos carregados (ex.: via import.meta.glob) em uma lista de Exercises ordenada por level.
 */
export function parseExercises(rawFiles: Record<string, unknown>): Exercise[] {
  const exercises: Exercise[] = [];

  for (const [filePath, content] of Object.entries(rawFiles)) {
    // Se o conteúdo foi importado como módulo default pelo Vite
    const rawData =
      typeof content === 'object' && content !== null && 'default' in content
        ? (content as { default: unknown }).default
        : content;

    const exercise = parseExercise(rawData, filePath);
    exercises.push(exercise);
  }

  // Ordena por nível e depois por módulo
  return exercises.sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    return a.id.localeCompare(b.id);
  });
}
