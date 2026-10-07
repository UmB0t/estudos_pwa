import React from 'react';
import type { EvaluationResult } from '@lab/shared';

interface FeedbackBannerProps {
  evaluation: EvaluationResult;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ evaluation }) => {
  const { status, message, error } = evaluation;

  const iconMap = {
    correct: '🟢',
    almost: '🟡',
    wrong: '🔴',
  };

  const titleMap = {
    correct: 'Excelente! Consulta Correta',
    almost: 'Quase lá! Ajuste os Detalhes',
    wrong: 'Resposta Incorreta',
  };

  return (
    <div className={`feedback-banner ${status}`}>
      <span className="feedback-icon">{iconMap[status]}</span>
      <div style={{ flex: 1 }}>
        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
          {titleMap[status]}
        </strong>
        <p className="feedback-text">{message}</p>
        {error && (
          <div className="error-details">
            <strong>Detalhes técnicos:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
};
