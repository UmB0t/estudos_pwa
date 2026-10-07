import React, { createContext, useContext, useState, useEffect } from 'react';
import type { EvaluationResult, Exercise } from '@lab/shared';
import { SqlEvaluator } from '@lab/exercise-engine';
import { createInProcessSqlSession, type ISqlEngine, type SqlQueryResult } from '@lab/sql-engine';
import { getDatasetSql } from '../content';
import type { EngineStatus } from '../types';

interface SqlEngineContextValue {
  status: EngineStatus;
  statusMessage: string;
  evaluateExercise: (exercise: Exercise, studentSql: string) => Promise<EvaluationResult>;
  getDatasetPreview: (datasetName: string) => Promise<SqlQueryResult | null>;
}

const SqlEngineContext = createContext<SqlEngineContextValue | null>(null);

export const SqlEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<EngineStatus>('initializing');
  const [statusMessage, setStatusMessage] = useState('Inicializando ambiente SQL...');
  const [evaluator] = useState(() => new SqlEvaluator());
  const [sessions] = useState<Map<string, ISqlEngine>>(() => new Map());
  const [previewCache] = useState<Map<string, SqlQueryResult>>(() => new Map());

  // Inicializa o dataset padrão 'alunos' na montagem
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setStatus('initializing');
        setStatusMessage('Carregando PGlite e dataset inicial...');
        const alunosSql = getDatasetSql('alunos');

        if (alunosSql) {
          const session = await createInProcessSqlSession(alunosSql);
          if (isMounted) {
            sessions.set('alunos', session);
            // Faz um preview das primeiras linhas
            const previewRes = await session.query('SELECT * FROM alunos LIMIT 8;');
            if (previewRes.success) {
              previewCache.set('alunos', previewRes.result);
            }
            setStatus('ready');
            setStatusMessage('Pronto');
          }
        } else {
          if (isMounted) {
            setStatus('ready');
            setStatusMessage('Pronto');
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setStatusMessage(`Falha ao carregar SQL: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      for (const session of sessions.values()) {
        session.close().catch(() => {});
      }
      sessions.clear();
    };
  }, [sessions, previewCache]);

  const evaluateExercise = async (
    exercise: Exercise,
    studentSql: string,
  ): Promise<EvaluationResult> => {
    setStatus('running');
    setStatusMessage('Executando verificação...');

    try {
      const datasetSql = exercise.dataset ? getDatasetSql(exercise.dataset) : undefined;
      const res = await evaluator.evaluate(
        {
          exercise,
          datasetSql,
        },
        studentSql,
      );
      setStatus('ready');
      setStatusMessage('Pronto');
      return res;
    } catch (err) {
      setStatus('ready');
      setStatusMessage('Pronto');
      return {
        status: 'wrong',
        message: 'Ocorreu um erro inesperado ao executar a avaliação.',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  };

  const getDatasetPreview = async (datasetName: string): Promise<SqlQueryResult | null> => {
    const cached = previewCache.get(datasetName);
    if (cached) return cached;

    const datasetSql = getDatasetSql(datasetName);
    if (!datasetSql) return null;

    try {
      const session = await createInProcessSqlSession(datasetSql);
      const res = await session.query(`SELECT * FROM ${datasetName} LIMIT 8;`);
      await session.close();
      if (res.success) {
        previewCache.set(datasetName, res.result);
        return res.result;
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <SqlEngineContext.Provider
      value={{
        status,
        statusMessage,
        evaluateExercise,
        getDatasetPreview,
      }}
    >
      {children}
    </SqlEngineContext.Provider>
  );
};

export function useSqlEngine(): SqlEngineContextValue {
  const context = useContext(SqlEngineContext);
  if (!context) {
    throw new Error('useSqlEngine deve ser utilizado dentro de um SqlEngineProvider');
  }
  return context;
}
