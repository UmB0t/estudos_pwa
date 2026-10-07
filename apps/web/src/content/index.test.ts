import { describe, expect, it } from 'vitest';
import {
  getAllExercises,
  getDatasetSql,
  getExerciseById,
  getPublicExerciseById,
  getPublicExercises,
} from './index';

describe('Content Loader (apps/web)', () => {
  it('deve carregar e validar todos os 8 exercícios de SQL iniciais', () => {
    const exercises = getAllExercises();
    expect(exercises.length).toBe(8);

    // Confere que todos pertencem à trilha sql
    for (const ex of exercises) {
      expect(ex.track).toBe('sql');
      expect(ex.solutions.length).toBeGreaterThanOrEqual(1);
      expect(ex.hints.length).toBe(2);
      expect(ex.dataset).toBe('alunos');
    }
  });

  it('getPublicExercises não deve expor o array de soluções', () => {
    const publicExs = getPublicExercises();
    expect(publicExs.length).toBe(8);

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
