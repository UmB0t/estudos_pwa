import type { ISqlEngine, SqlEnvironmentOptions, SqlExecutionResult } from '../types';
import type { WorkerFactory, WorkerTransport } from './worker-transport';
import type { WorkerInMessage, WorkerOutMessage } from './worker-protocol';

export class SqlWorkerClient implements ISqlEngine {
  private factory: WorkerFactory;
  private worker: WorkerTransport | null = null;
  private initPromise: Promise<void> | null = null;
  private datasetSql?: string;
  private setupSql?: string;
  private defaultTimeoutMs: number;
  private isClosed = false;

  private pendingRequests = new Map<
    string,
    {
      resolve: (res: SqlExecutionResult) => void;
      reject: (err: unknown) => void;
      timer?: ReturnType<typeof setTimeout>;
    }
  >();

  constructor(factory: WorkerFactory, options: SqlEnvironmentOptions = {}) {
    this.factory = factory;
    this.datasetSql = options.datasetSql;
    this.setupSql = options.setupSql;
    this.defaultTimeoutMs = options.timeoutMs ?? 3000;
  }

  private async ensureWorker(): Promise<void> {
    if (this.isClosed) {
      throw new Error('SqlWorkerClient foi encerrado.');
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.worker = this.factory.createWorker();

    this.worker.onMessage((rawMsg: unknown) => {
      const msg = rawMsg as WorkerOutMessage;
      if (!msg || typeof msg !== 'object') return;

      const pending = this.pendingRequests.get(msg.id);
      if (!pending) return;

      if (pending.timer) {
        clearTimeout(pending.timer);
      }
      this.pendingRequests.delete(msg.id);

      if (msg.type === 'ready') {
        pending.resolve({
          success: true,
          result: { columns: [], rows: [] },
        });
      } else if (msg.type === 'result') {
        pending.resolve(msg.payload);
      } else if (msg.type === 'error') {
        pending.resolve({
          success: false,
          error: msg.error,
          details: msg.details,
          code: msg.code,
        });
      }
    });

    this.worker.onError((err: Error) => {
      // Rejeita todas as requisições pendentes
      for (const [id, req] of this.pendingRequests.entries()) {
        if (req.timer) clearTimeout(req.timer);
        req.resolve({
          success: false,
          error: 'Erro no processo do Worker SQL.',
          details: err.message,
        });
        this.pendingRequests.delete(id);
      }
    });

    const initId = `init-${Date.now()}-${Math.random()}`;
    this.initPromise = new Promise<void>((resolve, reject) => {
      this.pendingRequests.set(initId, {
        resolve: () => resolve(),
        reject,
      });

      const initMsg: WorkerInMessage = {
        id: initId,
        type: 'init',
        datasetSql: this.datasetSql,
        setupSql: this.setupSql,
      };
      this.worker?.postMessage(initMsg);
    });

    return this.initPromise;
  }

  async ensureReady(): Promise<void> {
    await this.ensureWorker();
  }

  async query(sql: string, timeoutMs?: number): Promise<SqlExecutionResult> {
    if (this.isClosed) {
      return {
        success: false,
        error: 'A sessão SQL foi encerrada.',
        details: 'SqlWorkerClient is closed',
      };
    }

    await this.ensureWorker();

    const queryId = `q-${Date.now()}-${Math.random()}`;
    const timeout = timeoutMs ?? this.defaultTimeoutMs;

    return new Promise<SqlExecutionResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        // Timeout disparado: encerra o Worker e recria a instância automaticamente
        this.pendingRequests.delete(queryId);

        if (this.worker) {
          try {
            this.worker.terminate();
          } catch {
            // ignora
          }
          this.worker = null;
          this.initPromise = null;
        }

        resolve({
          success: false,
          error: 'A consulta excedeu o tempo limite de execução (timeout).',
          details: `Query execution timed out after ${timeout}ms`,
          code: '57014',
        });

        // Recria em segundo plano se não estiver fechado
        if (!this.isClosed) {
          this.ensureWorker().catch(() => {});
        }
      }, timeout);

      this.pendingRequests.set(queryId, {
        resolve,
        reject,
        timer,
      });

      const msg: WorkerInMessage = {
        id: queryId,
        type: 'query',
        sql,
      };
      this.worker?.postMessage(msg);
    });
  }

  async close(): Promise<void> {
    if (this.isClosed) return;
    this.isClosed = true;

    for (const [, req] of this.pendingRequests.entries()) {
      if (req.timer) clearTimeout(req.timer);
    }
    this.pendingRequests.clear();

    if (this.worker) {
      try {
        this.worker.postMessage({ id: 'close', type: 'close' });
        await this.worker.terminate();
      } catch {
        // ignora
      }
      this.worker = null;
    }
  }
}
