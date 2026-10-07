import { describe, expect, it } from 'vitest';
import { EvaluationResultSchema, type EvaluationResult } from './evaluation';

describe('EvaluationResultSchema', () => {
  it('deve validar resultado de sucesso (correct)', () => {
    const result: EvaluationResult = {
      status: 'correct',
      message: 'Parabéns! Sua consulta retornou exatamente os dados esperados.',
      studentResult: {
        columns: ['id', 'nome'],
        rows: [
          [1, 'Ana'],
          [2, 'Carlos'],
        ],
      },
    };

    const parsed = EvaluationResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it('deve validar resultado quase correto (almost)', () => {
    const result: EvaluationResult = {
      status: 'almost',
      message: 'Você retornou as linhas corretas, mas as colunas estão em ordem diferente.',
      studentResult: {
        columns: ['nome', 'id'],
        rows: [
          ['Ana', 1],
          ['Carlos', 2],
        ],
      },
    };

    const parsed = EvaluationResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('almost');
    }
  });

  it('deve validar resultado incorreto (wrong) com erro sintático', () => {
    const result: EvaluationResult = {
      status: 'wrong',
      message: 'A tabela informada não existe.',
      error: 'relation "alunox" does not exist',
    };

    const parsed = EvaluationResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('wrong');
      expect(parsed.data.error).toBe('relation "alunox" does not exist');
      expect(parsed.data.studentResult).toBeUndefined();
    }
  });

  it('deve rejeitar status não permitido', () => {
    const invalid = {
      status: 'success',
      message: 'Ok',
    };

    const parsed = EvaluationResultSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('deve rejeitar studentResult com formato de linhas inválido', () => {
    const invalid = {
      status: 'correct',
      message: 'Ok',
      studentResult: {
        columns: ['id'],
        rows: 'não é um array',
      },
    };

    const parsed = EvaluationResultSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('deve rejeitar se message estiver ausente', () => {
    const invalid = {
      status: 'wrong',
    };

    const parsed = EvaluationResultSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});
