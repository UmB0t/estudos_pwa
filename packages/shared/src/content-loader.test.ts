import { describe, expect, it } from 'vitest';
import { parseExercise, parseExercises, toPublicExercise } from './content-loader';
import type { Exercise } from './exercise';

describe('content-loader', () => {
  const validData: Exercise = {
    id: 'sql-test-01',
    track: 'sql',
    module: 'select',
    level: 1,
    title: 'Teste',
    difficulty: 'easy',
    prerequisites: [],
    question: 'Selecione tudo',
    orderMatters: false,
    skills: ['select'],
    hints: ['dica 1', 'dica 2'],
    solutions: ['SELECT 1;'],
  };

  it('deve fazer o parse com sucesso de um exercício válido', () => {
    const parsed = parseExercise(validData, 'content/sql/exercises/teste.json');
    expect(parsed.id).toBe('sql-test-01');
  });

  it('deve lançar erro descritivo indicando arquivo e campo faltante/inválido', () => {
    const invalidData = {
      ...validData,
      title: '', // Título vazio
      level: -1, // Nível negativo
    };

    expect(() =>
      parseExercise(invalidData, 'content/sql/exercises/invalido.json'),
    ).toThrowError(/Falha na validação do exercício em "content\/sql\/exercises\/invalido\.json"/);
  });

  it('toPublicExercise deve remover o array de solutions preservando os demais campos', () => {
    const publicEx = toPublicExercise(validData);
    expect((publicEx as Record<string, unknown>).solutions).toBeUndefined();
    expect(publicEx.id).toBe(validData.id);
    expect(publicEx.title).toBe(validData.title);
    expect(publicEx.hints).toEqual(validData.hints);
  });

  it('parseExercises deve carregar e ordenar múltiplos arquivos por nível', () => {
    const files = {
      'file2.json': { ...validData, id: 'ex-2', level: 2 },
      'file1.json': { ...validData, id: 'ex-1', level: 1 },
    };

    const list = parseExercises(files);
    expect(list.length).toBe(2);
    expect(list[0]?.level).toBe(1);
    expect(list[1]?.level).toBe(2);
  });
});
