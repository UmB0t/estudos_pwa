import { describe, expect, it } from 'vitest';
import { translateSqlError } from './error-translator';

describe('error-translator', () => {
  it('deve traduzir relação/tabela inexistente extraindo o nome da tabela', () => {
    const err = {
      code: '42P01',
      message: 'relation "alunos_extras" does not exist',
    };
    const translated = translateSqlError(err);
    expect(translated.message).toBe(
      'A tabela "alunos_extras" não foi encontrada no banco de dados.',
    );
    expect(translated.details).toBe('relation "alunos_extras" does not exist');
    expect(translated.code).toBe('42P01');
  });

  it('deve traduzir coluna inexistente extraindo o nome da coluna', () => {
    const err = {
      code: '42703',
      message: 'column "matricula_ano" does not exist',
    };
    const translated = translateSqlError(err);
    expect(translated.message).toBe('A coluna "matricula_ano" não existe.');
    expect(translated.details).toBe('column "matricula_ano" does not exist');
    expect(translated.code).toBe('42703');
  });

  it('deve traduzir erro de sintaxe extraindo o trecho próximo', () => {
    const err = {
      code: '42601',
      message: 'syntax error at or near "FORM"',
    };
    const translated = translateSqlError(err);
    expect(translated.message).toBe(
      'Erro de sintaxe próximo a "FORM". Verifique a escrita do comando.',
    );
    expect(translated.code).toBe('42601');
  });

  it('deve traduzir comando incompleto (syntax error at end of input)', () => {
    const err = new Error('syntax error at end of input');
    const translated = translateSqlError(err);
    expect(translated.message).toContain('instrução incompleta no final do comando');
    expect(translated.code).toBe('42601');
  });

  it('deve traduzir violação de transação somente leitura (código 25006)', () => {
    const err = {
      code: '25006',
      message: 'cannot execute INSERT in a read-only transaction',
    };
    const translated = translateSqlError(err);
    expect(translated.message).toBe(
      'Comandos de modificação de dados (INSERT, UPDATE, DELETE, etc.) não são permitidos nesta consulta.',
    );
    expect(translated.code).toBe('25006');
  });

  it('deve traduzir timeout de instrução (código 57014)', () => {
    const err = {
      code: '57014',
      message: 'canceling statement due to statement timeout',
    };
    const translated = translateSqlError(err);
    expect(translated.message).toBe(
      'A consulta excedeu o tempo limite de execução (timeout).',
    );
    expect(translated.code).toBe('57014');
  });

  it('deve traduzir erro de múltiplas instruções', () => {
    const err = new Error(
      'cannot insert multiple commands into a prepared statement',
    );
    const translated = translateSqlError(err);
    expect(translated.message).toBe(
      'Apenas uma única instrução SQL pode ser executada por vez.',
    );
  });
});
