import React, { useState, useEffect } from 'react';
import type { EvaluationResult, Exercise } from '@lab/shared';
import type { SqlQueryResult } from '@lab/sql-engine';
import { useSqlEngine } from '../context/SqlEngineContext';
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

  const [code, setCode] = useState('');
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [datasetPreview, setDatasetPreview] = useState<SqlQueryResult | null>(null);

  // Reseta o estado quando o exercício atual mudar
  useEffect(() => {
    setCode('');
    setHintsRevealed(0);
    setShowSolution(false);
    setEvaluation(null);
    setIsEvaluating(false);

    if (exercise.dataset) {
      getDatasetPreview(exercise.dataset).then((preview) => {
        setDatasetPreview(preview);
      });
    }
  }, [exercise, getDatasetPreview]);

  const handleVerify = async () => {
    if (!code.trim() || isEvaluating) return;

    setIsEvaluating(true);
    try {
      const res = await evaluateExercise(exercise, code);
      setEvaluation(res);
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

  return (
    <div className="split-view-container">
      {/* PAINEL ESQUERDO: Enunciado, Dataset de Exemplo, Dicas e Explicação */}
      <div className="left-panel">
        <div className="exercise-meta">
          <span className="back-link" onClick={onBack}>
            ← Voltar para todos os exercícios
          </span>
          <span className={`exercise-difficulty difficulty-${exercise.difficulty}`}>
            {exercise.difficulty}
          </span>
        </div>

        <div className="exercise-heading">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            MÓDULO: {exercise.module.toUpperCase()} • NÍVEL {exercise.level}
          </div>
          <h1>{exercise.title}</h1>
        </div>

        <div className="question-box">
          <p>{exercise.question}</p>
        </div>

        {/* Tabela de exemplo do dataset */}
        {datasetPreview && (
          <div className="dataset-preview-section">
            <ResultTable
              data={datasetPreview}
              title={`Exemplo de Dados: Tabela "${exercise.dataset ?? 'dados'}"`}
            />
          </div>
        )}

        {/* Seção de Dicas reveladas */}
        {hintsRevealed > 0 && (
          <div className="hint-box">
            <h4>💡 Dicas ({hintsRevealed}/{exercise.hints.length}):</h4>
            {exercise.hints.slice(0, hintsRevealed).map((hint, idx) => (
              <p key={idx} style={{ marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                <strong>{idx + 1}.</strong> {hint}
              </p>
            ))}
          </div>
        )}

        {/* Gabarito / Soluções exibidas sob demanda */}
        {showSolution && (
          <div className="solution-box">
            <h4>🔑 Resposta de Referência:</h4>
            <div className="code-snippet">{exercise.solutions[0]}</div>
          </div>
        )}

        {/* Explicação pedagógica exibida ao acertar ou revelar gabarito */}
        {(showSolution || evaluation?.status === 'correct') && exercise.explanation && (
          <div className="hint-box" style={{ borderColor: 'var(--success-border)' }}>
            <h4 style={{ color: 'var(--success)' }}>📖 Explicação Pedagógica:</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {exercise.explanation}
            </p>
          </div>
        )}
      </div>

      {/* PAINEL DIREITO: Editor SQL, Botões, Feedback e Resultado da Query do Aluno */}
      <div className="right-panel">
        <SqlEditor
          value={code}
          onChange={setCode}
          onExecute={handleVerify}
          disabled={isEvaluating}
        />

        {/* Barra de Ações */}
        <div className="action-bar">
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={handleVerify}
              disabled={isEvaluating || !code.trim() || status === 'running'}
            >
              {isEvaluating ? 'Verificando...' : 'Verificar (Ctrl+Enter)'}
            </button>

            {exercise.hints.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={handleRevealHint}
                disabled={hintsRevealed >= exercise.hints.length}
              >
                Dica ({hintsRevealed}/{exercise.hints.length})
              </button>
            )}

            {!showSolution && (
              <button className="btn btn-outline" onClick={handleShowAnswer}>
                Mostrar resposta
              </button>
            )}
          </div>

          {hasNext && onNext && (
            <button
              className="btn btn-secondary"
              onClick={onNext}
              style={{
                borderColor: evaluation?.status === 'correct' ? 'var(--success)' : undefined,
                color: evaluation?.status === 'correct' ? 'var(--success)' : undefined,
              }}
            >
              Próximo exercício →
            </button>
          )}
        </div>

        {/* Área de Feedback e Tabela de Resultados da Consulta do Aluno */}
        <div className="feedback-container">
          {evaluation && <FeedbackBanner evaluation={evaluation} />}

          {evaluation?.studentResult && (
            <ResultTable
              data={evaluation.studentResult}
              title="Resultado da sua consulta SQL:"
            />
          )}
        </div>
      </div>
    </div>
  );
};
