import type { SqlExecutionResult } from '../types';

export type WorkerInMessage =
  | { id: string; type: 'init'; datasetSql?: string; setupSql?: string }
  | { id: string; type: 'query'; sql: string }
  | { id: string; type: 'close' };

export type WorkerOutMessage =
  | { id: string; type: 'ready' }
  | { id: string; type: 'result'; payload: SqlExecutionResult }
  | { id: string; type: 'error'; error: string; details: string; code?: string };
