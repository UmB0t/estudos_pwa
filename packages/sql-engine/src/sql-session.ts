import type { PGlite } from '@electric-sql/pglite';
import { translateSqlError } from './error-translator';
import { validateSqlAllowlist } from './query-validator';
import type { ISqlEngine, SqlExecutionResult } from './types';

export class SqlSession implements ISqlEngine {
  private db: PGlite;
  private queue: Promise<void> = Promise.resolve();
  private isClosed = false;

  constructor(db: PGlite) {
    this.db = db;
  }

  /**
   * Executa scripts de DDL e carga inicial (dataset + setup).
   * Roda uma única vez durante a preparação do ambiente via exec().
   */
  async initialize(datasetSql?: string, setupSql?: string): Promise<void> {
    if (datasetSql && datasetSql.trim()) {
      await this.db.exec(datasetSql);
    }
    if (setupSql && setupSql.trim()) {
      await this.db.exec(setupSql);
    }
  }

  /**
   * Serializa a execução de instruções na instância para evitar concorrência.
   */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue = this.queue
        .then(async () => {
          try {
            const res = await fn();
            resolve(res);
          } catch (err) {
            reject(err);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Executa uma consulta do aluno com validação de allowlist e transação READ ONLY.
   */
  async query(sql: string): Promise<SqlExecutionResult> {
    if (this.isClosed) {
      return {
        success: false,
        error: 'A sessão SQL foi encerrada.',
        details: 'SqlSession closed',
      };
    }

    // 1. Validação de Allowlist (SELECT, WITH, (SELECT))
    const validation = validateSqlAllowlist(sql);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error!,
        details: validation.error!,
      };
    }

    // 2. Execução serializada com READ ONLY e ROLLBACK no finally
    return this.enqueue(async () => {
      await this.db.exec('BEGIN TRANSACTION READ ONLY;');
      try {
        const raw = await this.db.query(validation.sanitizedSql, [], {
          rowMode: 'array',
        });

        const columns = raw.fields.map((f) => f.name);
        const rows = raw.rows as unknown[][];

        return {
          success: true,
          result: {
            columns,
            rows,
          },
        };
      } catch (err) {
        const translated = translateSqlError(err);
        return {
          success: false,
          error: translated.message,
          details: translated.details,
          code: translated.code,
        };
      } finally {
        try {
          await this.db.exec('ROLLBACK;');
        } catch {
          // Ignora erro de rollback se a transação já foi abortada
        }
      }
    });
  }

  async close(): Promise<void> {
    if (!this.isClosed) {
      this.isClosed = true;
      await this.db.close();
    }
  }
}
