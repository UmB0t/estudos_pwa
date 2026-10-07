import { describe, expect, it } from 'vitest';
import { ExerciseSchema, type Exercise } from './exercise';

describe('ExerciseSchema', () => {
  const validExercise: Exercise = {
    id: 'sql-select-01',
    track: 'sql',
    module: 'select',
    level: 1,
    title: 'Selecionar todos os alunos',
    difficulty: 'easy',
    prerequisites: [],
    question: 'Selecione todos os alunos da tabela alunos.',
    dataset: 'alunos',
    setup: 'CREATE TABLE IF NOT EXISTS teste (id INT);',
    orderMatters: false,
    skills: ['select', 'sql-basico'],
    hints: ['Use SELECT *', 'FROM alunos'],
    solutions: ['SELECT * FROM alunos;', 'SELECT * FROM alunos'],
    explanation: 'O asterisco seleciona todas as colunas.',
  };

  it('deve validar com sucesso um exercício completo e válido', () => {
    const parsed = ExerciseSchema.safeParse(validExercise);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBe('sql-select-01');
      expect(parsed.data.track).toBe('sql');
      expect(parsed.data.orderMatters).toBe(false);
    }
  });

  it('deve validar um exercício com campos opcionais omitidos', () => {
    const minimal = {
      id: 'sql-select-02',
      track: 'sql',
      module: 'select',
      level: 1,
      title: 'Apenas nomes',
      difficulty: 'easy',
      prerequisites: ['sql-select-01'],
      question: 'Selecione o nome dos alunos.',
      orderMatters: true,
      skills: ['select'],
      hints: [],
      solutions: ['SELECT nome FROM alunos;'],
    };

    const parsed = ExerciseSchema.safeParse(minimal);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dataset).toBeUndefined();
      expect(parsed.data.setup).toBeUndefined();
      expect(parsed.data.explanation).toBeUndefined();
    }
  });

  it('deve rejeitar track inválida', () => {
    const invalid = { ...validExercise, track: 'kubernetes' };
    const parsed = ExerciseSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('deve rejeitar difficulty inválida', () => {
    const invalid = { ...validExercise, difficulty: 'impossible' };
    const parsed = ExerciseSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('deve rejeitar lista de solutions vazia', () => {
    const invalid = { ...validExercise, solutions: [] };
    const parsed = ExerciseSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain('Ao menos uma solução é obrigatória');
    }
  });

  it('deve rejeitar id vazio', () => {
    const invalid = { ...validExercise, id: '' };
    const parsed = ExerciseSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('deve rejeitar level não positivo ou não inteiro', () => {
    const zeroLevel = { ...validExercise, level: 0 };
    expect(ExerciseSchema.safeParse(zeroLevel).success).toBe(false);

    const floatLevel = { ...validExercise, level: 1.5 };
    expect(ExerciseSchema.safeParse(floatLevel).success).toBe(false);

    const negativeLevel = { ...validExercise, level: -2 };
    expect(ExerciseSchema.safeParse(negativeLevel).success).toBe(false);
  });

  it('deve rejeitar orderMatters não booleano', () => {
    const invalid = { ...validExercise, orderMatters: 'false' };
    const parsed = ExerciseSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});
