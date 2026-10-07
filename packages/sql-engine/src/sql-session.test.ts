import { describe, expect, it } from 'vitest';
import { createInProcessSqlSession } from './index';

describe('SqlSession (Núcleo in-process)', () => {
  const datasetAlunos = `
    CREATE TABLE alunos (
      id INT PRIMARY KEY,
      nome TEXT NOT NULL,
      idade INT NOT NULL,
      cidade TEXT
    );
    INSERT INTO alunos VALUES
      (1, 'Ana Silva', 20, 'São Paulo'),
      (2, 'Bruno Costa', 22, 'Rio de Janeiro'),
      (3, 'Carlos Lima', 19, NULL);
  `;

  it('deve executar uma consulta SELECT válida e retornar colunas e linhas corretas', async () => {
    const session = await createInProcessSqlSession(datasetAlunos);
    try {
      const res = await session.query('SELECT nome, idade FROM alunos ORDER BY id ASC;');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.result.columns).toEqual(['nome', 'idade']);
        expect(res.result.rows).toEqual([
          ['Ana Silva', 20],
          ['Bruno Costa', 22],
          ['Carlos Lima', 19],
        ]);
      }
    } finally {
      await session.close();
    }
  });

  it('deve suportar consultas complexas com WITH (CTEs)', async () => {
    const session = await createInProcessSqlSession(datasetAlunos);
    try {
      const res = await session.query(`
        WITH maiores AS (
          SELECT * FROM alunos WHERE idade >= 20
        )
        SELECT COUNT(*) AS total FROM maiores;
      `);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.result.columns).toEqual(['total']);
        expect(Number(res.result.rows[0]?.[0])).toBe(2);
      }
    } finally {
      await session.close();
    }
  });

  it('deve suportar consulta envolvida por parênteses (SELECT ...)', async () => {
    const session = await createInProcessSqlSession(datasetAlunos);
    try {
      const res = await session.query('(SELECT nome FROM alunos WHERE id = 1);');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.result.rows[0]?.[0]).toBe('Ana Silva');
      }
    } finally {
      await session.close();
    }
  });

  it('deve rejeitar comandos de modificação (DROP, INSERT, etc.) pela allowlist', async () => {
    const session = await createInProcessSqlSession(datasetAlunos);
    try {
      const dropRes = await session.query('DROP TABLE alunos;');
      expect(dropRes.success).toBe(false);
      if (!dropRes.success) {
        expect(dropRes.error).toContain('Apenas consultas de leitura iniciadas com SELECT ou WITH');
      }

      const insertRes = await session.query("INSERT INTO alunos VALUES (4, 'Daniel', 25, 'BH');");
      expect(insertRes.success).toBe(false);
    } finally {
      await session.close();
    }
  });

  it('deve rejeitar múltiplas instruções na mesma chamada', async () => {
    const session = await createInProcessSqlSession(datasetAlunos);
    try {
      const res = await session.query('SELECT 1; SELECT 2;');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Apenas uma única instrução SQL pode ser executada por vez.');
      }
    } finally {
      await session.close();
    }
  });

  it('deve recuperar e permitir nova consulta após um erro na mesma instância (ROLLBACK no finally)', async () => {
    const session = await createInProcessSqlSession(datasetAlunos);
    try {
      // 1. Primeira query com erro (coluna inexistente)
      const errRes = await session.query('SELECT coluna_inexistente FROM alunos;');
      expect(errRes.success).toBe(false);
      if (!errRes.success) {
        expect(errRes.error).toContain('A coluna "coluna_inexistente" não existe.');
      }

      // 2. Segunda query válida executada na MESMA conexão
      const okRes = await session.query('SELECT nome FROM alunos WHERE id = 1;');
      expect(okRes.success).toBe(true);
      if (okRes.success) {
        expect(okRes.result.rows[0]?.[0]).toBe('Ana Silva');
      }
    } finally {
      await session.close();
    }
  });

  it('deve garantir isolamento: tabela criada no exercício A não existe no exercício B', async () => {
    const setupA = 'CREATE TABLE tabela_ex_a (id INT, valor TEXT);';
    const sessionA = await createInProcessSqlSession(datasetAlunos, setupA);
    const sessionB = await createInProcessSqlSession(datasetAlunos); // sem setupA

    try {
      // No exercício A, tabela_ex_a existe
      const resA = await sessionA.query('SELECT * FROM tabela_ex_a;');
      expect(resA.success).toBe(true);

      // No exercício B, tabela_ex_a NÃO existe
      const resB = await sessionB.query('SELECT * FROM tabela_ex_a;');
      expect(resB.success).toBe(false);
      if (!resB.success) {
        expect(resB.error).toContain('A tabela "tabela_ex_a" não foi encontrada no banco de dados.');
      }
    } finally {
      await sessionA.close();
      await sessionB.close();
    }
  });

  it('deve serializar queries concorrentes na mesma instância sem conflito de conexão', async () => {
    const session = await createInProcessSqlSession(datasetAlunos);
    try {
      const [res1, res2, res3] = await Promise.all([
        session.query('SELECT nome FROM alunos WHERE id = 1;'),
        session.query('SELECT nome FROM alunos WHERE id = 2;'),
        session.query('SELECT nome FROM alunos WHERE id = 3;'),
      ]);

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res3.success).toBe(true);
      if (res1.success && res2.success && res3.success) {
        expect(res1.result.rows[0]?.[0]).toBe('Ana Silva');
        expect(res2.result.rows[0]?.[0]).toBe('Bruno Costa');
        expect(res3.result.rows[0]?.[0]).toBe('Carlos Lima');
      }
    } finally {
      await session.close();
    }
  });
});
