import { describe, expect, it } from 'vitest';
import { NodeWorkerFactory } from './worker/node-worker-factory';
import { SqlWorkerClient } from './worker/sql-worker-client';

describe('SqlWorkerClient (Transporte via Worker)', () => {
  const dataset = `
    CREATE TABLE alunos (id INT, nome TEXT);
    INSERT INTO alunos VALUES (1, 'Mariana');
  `;

  it('deve executar uma consulta com sucesso através do Worker', async () => {
    const client = new SqlWorkerClient(new NodeWorkerFactory(), {
      datasetSql: dataset,
    });

    try {
      const res = await client.query('SELECT nome FROM alunos WHERE id = 1;');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.result.columns).toEqual(['nome']);
        expect(res.result.rows).toEqual([['Mariana']]);
      }
    } finally {
      await client.close();
    }
  });

  it('deve cancelar a query travada (pg_sleep) via timeout e terminate()', { timeout: 10000 }, async () => {
    const client = new SqlWorkerClient(new NodeWorkerFactory(), {
      datasetSql: dataset,
      timeoutMs: 500, // Timeout de 500ms
    });

    try {
      // Pré-aquece a inicialização do WASM para medir estritamente o tempo da query
      await client.ensureReady();

      const start = Date.now();
      const res = await client.query('SELECT pg_sleep(10);', 500);
      const elapsed = Date.now() - start;

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('A consulta excedeu o tempo limite de execução (timeout).');
        expect(res.code).toBe('57014');
      }
      // O timeout de 500ms deve ser atingido bem antes dos 10 segundos da query
      expect(elapsed).toBeGreaterThanOrEqual(450);
      expect(elapsed).toBeLessThan(3000);
    } finally {
      await client.close();
    }
  });

  it('deve recriar a instância do Worker automaticamente após um terminate() por timeout', { timeout: 10000 }, async () => {
    const client = new SqlWorkerClient(new NodeWorkerFactory(), {
      datasetSql: dataset,
      timeoutMs: 400,
    });

    try {
      await client.ensureReady();

      // 1. Query com timeout que força terminate()
      const timeoutRes = await client.query('SELECT pg_sleep(10);', 400);
      expect(timeoutRes.success).toBe(false);

      // 2. Query seguinte válida na mesma instância deve funcionar devido ao auto-recovery
      const okRes = await client.query('SELECT nome FROM alunos WHERE id = 1;', 3000);
      expect(okRes.success).toBe(true);
      if (okRes.success) {
        expect(okRes.result.rows[0]?.[0]).toBe('Mariana');
      }
    } finally {
      await client.close();
    }
  });
});
