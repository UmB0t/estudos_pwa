export interface SqlQueryResult {
  columns: string[];
  rows: unknown[][];
}

export interface SqlExecutionSuccess {
  success: true;
  result: SqlQueryResult;
}

export interface SqlExecutionError {
  success: false;
  error: string;
  details: string;
  code?: string;
}

export type SqlExecutionResult = SqlExecutionSuccess | SqlExecutionError;

export interface SqlEnvironmentOptions {
  datasetSql?: string;
  setupSql?: string;
  timeoutMs?: number;
}

export interface ISqlEngine {
  query(sql: string, timeoutMs?: number): Promise<SqlExecutionResult>;
  close(): Promise<void>;
}
