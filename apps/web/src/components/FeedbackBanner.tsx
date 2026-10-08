import React from 'react';
import type { EvaluationResult } from '@lab/shared';

interface FeedbackBannerProps {
  evaluation: EvaluationResult;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ evaluation }) => {
  const { status, message, error } = evaluation;

  const iconMap = {
    correct: '🎉',
    almost: '⚡',
    wrong: '❌',
  };

  const isExecutionError = status === 'wrong' && (Boolean(error) || message.toLowerCase().startsWith('erro'));

  const getTitle = () => {
    if (status === 'correct') return 'Excelente! Consulta Correta';
    if (status === 'almost') return 'Quase lá! Pequeno ajuste necessário';
    if (isExecutionError) return 'Atenção: Erro de Sintaxe ou Execução';
    return 'Ops! O resultado divergiu do esperado';
  };

  return (
    <div className={`feedback-card feedback-${status}`}>
      <div className="feedback-icon-box">
        <span>{isExecutionError ? '⚠️' : iconMap[status]}</span>
      </div>
      <div className="feedback-body">
        <h4 className="feedback-title">{getTitle()}</h4>
        <p className="feedback-message">{message}</p>
        {error && (
          <div className="feedback-technical-error">
            <span className="error-badge">Detalhes Técnicos da Engine</span>
            <code>{error}</code>
          </div>
        )}
      </div>
    </div>
  );
};
