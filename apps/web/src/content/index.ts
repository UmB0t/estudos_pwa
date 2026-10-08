import {
  parseExercises,
  toPublicExercise,
  type Exercise,
  type PublicExercise,
  type ExerciseTrack,
} from '@lab/shared';

// Carregamento estático de todos os arquivos JSON de exercícios em content/*/exercises
const exerciseModules = import.meta.glob(
  '../../../../content/*/exercises/*.json',
  { eager: true },
);

// Carregamento estático dos arquivos de dataset em content/sql/datasets (*.sql como texto bruto)
const datasetModules = import.meta.glob(
  '../../../../content/sql/datasets/*.sql',
  { eager: true, query: '?raw', import: 'default' },
);

// Validação e estruturação de todos os exercícios via schema Zod de @lab/shared
const loadedExercises: Exercise[] = parseExercises(
  exerciseModules as Record<string, unknown>,
);

// Mapa de datasets carregados (chave: nome do dataset sem .sql)
const loadedDatasets: Record<string, string> = {};
for (const [path, sqlContent] of Object.entries(datasetModules)) {
  const match = path.match(/\/([^/]+)\.sql$/);
  if (match?.[1] && typeof sqlContent === 'string') {
    loadedDatasets[match[1]] = sqlContent;
  }
}

/**
 * Retorna todos os exercícios completos (incluindo solutions).
 * Utilizado pelo motor de avaliação e para revelar gabaritos sob demanda.
 */
export function getAllExercises(): Exercise[] {
  return [...loadedExercises];
}

/**
 * Retorna todos os exercícios em formato público (sem solutions).
 * Utilizado para alimentar com segurança as listagens e cards da interface de usuário.
 */
export function getPublicExercises(): PublicExercise[] {
  return loadedExercises.map(toPublicExercise);
}

/**
 * Retorna exercícios públicos filtrados por trilha.
 */
export function getExercisesByTrack(track: ExerciseTrack): PublicExercise[] {
  return loadedExercises.filter((ex) => ex.track === track).map(toPublicExercise);
}

/**
 * Obtém um exercício completo pelo identificador único.
 */
export function getExerciseById(id: string): Exercise | undefined {
  return loadedExercises.find((ex) => ex.id === id);
}

/**
 * Obtém um exercício higienizado (sem solutions) pelo identificador único.
 */
export function getPublicExerciseById(id: string): PublicExercise | undefined {
  const ex = getExerciseById(id);
  return ex ? toPublicExercise(ex) : undefined;
}

/**
 * Retorna o script DDL + INSERTs de um dataset pelo seu nome (ex.: 'alunos').
 */
export function getDatasetSql(name: string): string | undefined {
  return loadedDatasets[name];
}
