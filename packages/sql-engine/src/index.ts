import { PGlite } from '@electric-sql/pglite';
import { SqlSession } from './sql-session';
import { InstanceCache } from './instance-cache';
import { BrowserWorkerFactory } from './worker/browser-worker-factory';
import { SqlWorkerClient } from './worker/sql-worker-client';
import type { WorkerFactory } from './worker/worker-transport';
import type { ISqlEngine, SqlEnvironmentOptions } from './types';

export * from './types';
export * from './query-validator';
export * from './error-translator';
export * from './sql-session';
export * from './instance-cache';
export * from './worker/worker-transport';
export * from './worker/worker-protocol';
export * from './worker/browser-worker-factory';
export * from './worker/sql-worker-client';

export const SQL_ENGINE_VERSION = '0.1.0';

/**
 * Cria uma sessão em processo direto (sem Worker), ideal para testes unitários ou Node.
 */
export async function createInProcessSqlSession(
  datasetSql?: string,
  setupSql?: string,
): Promise<SqlSession> {
  const db = new PGlite();
  await db.waitReady;
  const session = new SqlSession(db);
  await session.initialize(datasetSql, setupSql);
  return session;
}

// Cache global padrão de instâncias de Worker (máximo 3)
const globalWorkerCache = new InstanceCache<SqlWorkerClient>(3);

/**
 * Cria um ambiente SQL isolado gerenciado por Worker com timeout e cache LRU.
 */
export async function createSqlEnvironment(
  options: SqlEnvironmentOptions = {},
  customFactory?: WorkerFactory,
): Promise<ISqlEngine> {
  const cacheKey = InstanceCache.makeKey(options.datasetSql, options.setupSql);
  const cached = globalWorkerCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const factory = customFactory ?? new BrowserWorkerFactory();

  const client = new SqlWorkerClient(factory, options);
  await globalWorkerCache.set(cacheKey, client);
  return client;
}
