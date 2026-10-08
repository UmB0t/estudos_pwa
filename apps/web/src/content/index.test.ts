import { describe, expect, it } from 'vitest';
import {
  getAllExercises,
  getDatasetSql,
  getExerciseById,
  getPublicExerciseById,
  getPublicExercises,
} from './index';

describe('Content Loader (apps/web)', () => {
  it('deve carregar e validar todos os 19 exercícios das 4 trilhas', () => {
    const exercises = getAllExercises();
    expect(exercises.length).toBe(19);

    const sqlExs = exercises.filter((ex) => ex.track === 'sql');
    const linuxExs = exercises.filter((ex) => ex.track === 'linux');
    const dockerExs = exercises.filter((ex) => ex.track === 'docker');
    const networkExs = exercises.filter((ex) => ex.track === 'networks');

    expect(sqlExs.length).toBe(8);
    expect(linuxExs.length).toBe(5);
    expect(dockerExs.length).toBe(3);
    expect(networkExs.length).toBe(3);

    for (const ex of exercises) {
      expect(ex.solutions.length).toBeGreaterThanOrEqual(1);
      expect(ex.hints.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('getPublicExercises não deve expor o array de soluções', () => {
    const publicExs = getPublicExercises();
    expect(publicExs.length).toBe(19);

    for (const pEx of publicExs) {
      expect((pEx as Record<string, unknown>).solutions).toBeUndefined();
      expect(pEx.id).toBeDefined();
      expect(pEx.title).toBeDefined();
      expect(pEx.question).toBeDefined();
    }
  });

  it('deve carregar o dataset alunos com sucesso', () => {
    const sql = getDatasetSql('alunos');
    expect(sql).toBeDefined();
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS alunos');
    expect(sql).toContain('Ana Silva');
    expect(sql).toContain('Engenharia de Software');
  });

  it('deve permitir buscar exercício por ID tanto completo quanto público', () => {
    const full = getExerciseById('sql-01-select-todos-alunos');
    expect(full).toBeDefined();
    expect(full?.solutions).toBeDefined();

    const pub = getPublicExerciseById('sql-01-select-todos-alunos');
    expect(pub).toBeDefined();
    expect((pub as Record<string, unknown>)?.solutions).toBeUndefined();
    expect(pub?.title).toBe('Selecionar todos os alunos');
  });
});
