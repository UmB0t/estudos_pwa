import { describe, expect, it } from 'vitest';
import { stripSqlComments, validateSqlAllowlist } from './query-validator';

describe('query-validator', () => {
  it('deve remover comentários de linha única e de bloco', () => {
    const sql = `
      -- Comentário inicial
      /* Comentário
         em bloco */
      SELECT nome FROM alunos -- comentário final
    `;
    const clean = stripSqlComments(sql);
    expect(clean).toBe('SELECT nome FROM alunos');
  });

  it('deve aceitar consultas válidas iniciando com SELECT', () => {
    const res = validateSqlAllowlist('SELECT id, nome FROM alunos;');
    expect(res.valid).toBe(true);
    expect(res.sanitizedSql).toBe('SELECT id, nome FROM alunos;');
  });

  it('deve aceitar consultas iniciando com WITH (CTEs)', () => {
    const res = validateSqlAllowlist(`
      WITH alunos_sp AS (
        SELECT * FROM alunos WHERE cidade = 'São Paulo'
      )
      SELECT * FROM alunos_sp;
    `);
    expect(res.valid).toBe(true);
  });

  it('deve aceitar consultas envolvidas por parênteses (SELECT ...)', () => {
    const res = validateSqlAllowlist('(SELECT 1 AS numero);');
    expect(res.valid).toBe(true);

    const nested = validateSqlAllowlist('(( SELECT 1 AS numero ));');
    expect(nested.valid).toBe(true);
  });

  it('deve aceitar consulta com comentários antes do SELECT', () => {
    const res = validateSqlAllowlist(`
      -- Meu comentário
      /* Outro bloco */
      SELECT * FROM alunos;
    `);
    expect(res.valid).toBe(true);
  });

  it('deve rejeitar comandos de modificação (DROP, INSERT, UPDATE, DELETE)', () => {
    expect(validateSqlAllowlist('DROP TABLE alunos;').valid).toBe(false);
    expect(validateSqlAllowlist('INSERT INTO alunos VALUES (1);').valid).toBe(false);
    expect(validateSqlAllowlist('UPDATE alunos SET nome = "X";').valid).toBe(false);
    expect(validateSqlAllowlist('DELETE FROM alunos;').valid).toBe(false);
    expect(validateSqlAllowlist('CREATE TABLE x (id INT);').valid).toBe(false);
  });

  it('deve rejeitar consultas vazias ou contendo apenas comentários', () => {
    expect(validateSqlAllowlist('').valid).toBe(false);
    expect(validateSqlAllowlist('   \n\t  ').valid).toBe(false);
    expect(validateSqlAllowlist('-- apenas comentário').valid).toBe(false);
    expect(validateSqlAllowlist('/* apenas bloco */').valid).toBe(false);
  });
});
