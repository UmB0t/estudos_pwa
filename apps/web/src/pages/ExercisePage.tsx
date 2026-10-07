import React, { useState, useEffect } from 'react';
import type { EvaluationResult, Exercise } from '@lab/shared';
import type { SqlQueryResult } from '@lab/sql-engine';
import { useSqlEngine } from '../context/SqlEngineContext';
import { useProgression } from '../context/ProgressionContext';
import { SqlEditor } from '../components/SqlEditor';
import { ResultTable } from '../components/ResultTable';
import { FeedbackBanner } from '../components/FeedbackBanner';

interface ExercisePageProps {
  exercise: Exercise;
  onBack: () => void;
  onNext?: () => void;
  hasNext: boolean;
  onSuccess?: () => void;
}

export const ExercisePage: React.FC<ExercisePageProps> = ({
  exercise,
  onBack,
  onNext,
  hasNext,
  onSuccess,
}) => {
  const { evaluateExercise, getDatasetPreview, status } = useSqlEngine();
  const { recordAttempt, getExerciseProgress } = useProgression();

  const [code, setCode] = useState('');
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [datasetPreview, setDatasetPreview] = useState<SqlQueryResult | null>(null);

  const existingProgress = getExerciseProgress(exercise.id);

  // Reseta o estado quando o exercício atual mudar
  useEffect(() => {
    const saved = getExerciseProgress(exercise.id);
    setCode(saved?.lastCode || '');
    setHintsRevealed(0);
    setShowSolution(false);
    setEvaluation(null);
    setIsEvaluating(false);

    if (exercise.dataset) {
      getDatasetPreview(exercise.dataset).then((preview) => {
        setDatasetPreview(preview);
      });
    }
  }, [exercise, getDatasetPreview, getExerciseProgress]);

  const handleVerify = async () => {
    if (!code.trim() || isEvaluating) return;

    setIsEvaluating(true);
    const startTime = performance.now();
    try {
      const res = await evaluateExercise(exercise, code);
      const executionTimeMs = Math.round(performance.now() - startTime);
      setEvaluation(res);

      // Registra a tentativa no progression engine
      await recordAttempt({
        exerciseId: exercise.id,
        trackId: exercise.track,
        moduleId: exercise.module,
        code,
        status: res.status,
        isSuccess: res.status === 'correct',
        executionTimeMs,
        hintsViewed: hintsRevealed,
      });

      if (res.status === 'correct' && onSuccess) {
        onSuccess();
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRevealHint = () => {
    if (hintsRevealed < exercise.hints.length) {
      setHintsRevealed((prev) => prev + 1);
    }
  };

  const handleShowAnswer = () => {
    setShowSolution(true);
  };

  const handleRestoreLastCode = () => {
    if (existingProgress?.lastCode) {
      setCode(existingProgress.lastCode);
    }
  };

  return (
    <div className="split-view-container">
      {/* PAINEL ESQUERDO: Enunciado, Dataset de Exemplo, Dicas e Explicação Pedagógica */}
      <div className="exercise-left-panel">
        <div className="panel-top-nav">
          <button className="breadcrumb-btn" onClick={onBack}>
            ← Voltar ao Painel
          </button>
          <div className="exercise-header-badges">
            {existingProgress?.completed && (
              <span className="badge-ok-pill">✅ Concluído</span>
            )}
            <span className={`difficulty-tag difficulty-${exercise.difficulty}`}>
              {exercise.difficulty}
            </span>
          </div>
        </div>

        <div className="exercise-title-section">
          <div className="exercise-sub-tag">
            <span>TRILHA: {exercise.track.toUpperCase()}</span>
            <span>•</span>
            <span>MÓDULO: {exercise.module.toUpperCase()}</span>
            <span>•</span>
            <span>NÍVEL {exercise.level}</span>
            {existingProgress && existingProgress.attemptsCount > 0 && (
              <>
                <span>•</span>
                <span className="attempts-indicator">
                  {existingProgress.attemptsCount}{' '}
                  {existingProgress.attemptsCount === 1 ? 'tentativa' : 'tentativas'}
                </span>
              </>
            )}
          </div>
          <h1 className="exercise-h1">{exercise.title}</h1>
        </div>

        <div className="question-card">
          <h3 className="question-label">Tarefa a Realizar:</h3>
          <p className="question-text">{exercise.question}</p>
        </div>

        {/* Tabela de exemplo do dataset */}
        {datasetPreview && (
          <div className="dataset-section">
            <ResultTable
              data={datasetPreview}
              title={`Esquema & Dados da Tabela: "${exercise.dataset ?? 'dados'}"`}
            />
          </div>
        )}

        {/* Dicas Reveladas */}
        {hintsRevealed > 0 && (
          <div className="hints-container">
            <h4 className="hints-title">💡 Dicas Reveladas ({hintsRevealed}/{exercise.hints.length}):</h4>
            {exercise.hints.slice(0, hintsRevealed).map((hint, idx) => (
              <div key={idx} className="hint-item">
                <span className="hint-num">{idx + 1}</span>
                <p className="hint-text">{hint}</p>
              </div>
            ))}
          </div>
        )}

        {/* Gabarito / Resposta de Referência */}
        {showSolution && (
          <div className="solution-container">
            <h4 className="solution-title">🔑 Solução de Referência:</h4>
            <pre className="code-navy-block">{exercise.solutions[0]}</pre>
          </div>
        )}

        {/* Explicação Pedagógica */}
        {(showSolution || evaluation?.status === 'correct') && exercise.explanation && (
          <div className="explanation-container">
            <h4 className="explanation-title">📖 Explicação Conceitual:</h4>
            <p className="explanation-text">{exercise.explanation}</p>
          </div>
        )}
      </div>

      {/* PAINEL DIREITO: Terminal SQL, Barra de Ações, Banners e Resultado da Consulta */}
      <div className="exercise-right-panel">
        <SqlEditor
          value={code}
          onChange={setCode}
          onExecute={handleVerify}
          disabled={isEvaluating}
        />

        {/* Barra de Ações */}
        <div className="editor-action-bar">
          <div className="action-buttons-left">
            <button
              className="btn btn-yel-submit"
              onClick={handleVerify}
              disabled={isEvaluating || !code.trim() || status === 'running'}
            >
              {isEvaluating ? 'Verificando...' : 'Verificar resposta (Ctrl+Enter)'}
            </button>

            {exercise.hints.length > 0 && (
              <button
                className="btn ghost"
                onClick={handleRevealHint}
                disabled={hintsRevealed >= exercise.hints.length}
              >
                💡 Dica ({hintsRevealed}/{exercise.hints.length})
              </button>
            )}

            {!showSolution && (
              <button className="btn ghost" onClick={handleShowAnswer}>
                🔑 Ver resposta
              </button>
            )}

            {existingProgress?.lastCode && existingProgress.lastCode !== code && (
              <button className="btn ghost" onClick={handleRestoreLastCode} title="Restaurar o código da sua última tentativa">
                ↺ Restaurar código
              </button>
            )}
          </div>

          {hasNext && onNext && (
            <button
              className={`btn btn-next ${evaluation?.status === 'correct' ? 'highlight-next' : ''}`}
              onClick={onNext}
            >
              Próximo exercício →
            </button>
          )}
        </div>

        {/* Área de Feedback e Tabela de Resultados */}
        <div className="results-and-feedback-area">
          {evaluation && <FeedbackBanner evaluation={evaluation} />}

          {evaluation?.studentResult && (
            <ResultTable
              data={evaluation.studentResult}
              title="Resultado retornado pela sua consulta:"
            />
          )}
        </div>
      </div>
    </div>
  );
};
