import { PGlite } from '@electric-sql/pglite';
import { translateSqlError } from '../error-translator';
import { validateSqlAllowlist } from '../query-validator';
import type { WorkerInMessage, WorkerOutMessage } from './worker-protocol';

let db: PGlite | null = null;
let isClosed = false;

self.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;
  if (!msg || typeof msg !== 'object') return;
  const { id, type } = msg;

  try {
    if (type === 'init') {
      db = new PGlite();
      await db.waitReady;
      if (msg.datasetSql && msg.datasetSql.trim()) {
        await db.exec(msg.datasetSql);
      }
      if (msg.setupSql && msg.setupSql.trim()) {
        await db.exec(msg.setupSql);
      }
      const out: WorkerOutMessage = { id, type: 'ready' };
      self.postMessage(out);
      return;
    }

    if (type === 'query') {
      if (!db || isClosed) {
        const out: WorkerOutMessage = {
          id,
          type: 'result',
          payload: {
            success: false,
            error: 'O ambiente SQL não está pronto ou foi encerrado.',
            details: 'Database uninitialized or closed',
          },
        };
        self.postMessage(out);
        return;
      }

      const val = validateSqlAllowlist(msg.sql);
      if (!val.valid) {
        const out: WorkerOutMessage = {
          id,
          type: 'result',
          payload: {
            success: false,
            error: val.error!,
            details: val.error!,
          },
        };
        self.postMessage(out);
        return;
      }

      await db.exec('BEGIN TRANSACTION READ ONLY;');
      try {
        const raw = await db.query(val.sanitizedSql, [], { rowMode: 'array' });
        const columns = raw.fields.map((f) => f.name);
        const rows = raw.rows as unknown[][];

        const out: WorkerOutMessage = {
          id,
          type: 'result',
          payload: {
            success: true,
            result: { columns, rows },
          },
        };
        self.postMessage(out);
      } catch (err) {
        const translated = translateSqlError(err);
        const out: WorkerOutMessage = {
          id,
          type: 'result',
          payload: {
            success: false,
            error: translated.message,
            details: translated.details,
            code: translated.code,
          },
        };
        self.postMessage(out);
      } finally {
        try {
          await db.exec('ROLLBACK;');
        } catch {
          // ignora
        }
      }
      return;
    }

    if (type === 'close') {
      isClosed = true;
      if (db) {
        await db.close();
      }
      return;
    }
  } catch (err) {
    const translated = translateSqlError(err);
    const out: WorkerOutMessage = {
      id,
      type: 'error',
      error: translated.message,
      details: translated.details,
      code: translated.code,
    };
    self.postMessage(out);
  }
};
