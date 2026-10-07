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

  const titleMap = {
    correct: 'Excelente! Consulta Correta',
    almost: 'Quase lá! Pequeno ajuste necessário',
    wrong: 'Ops! O resultado divergiu do esperado',
  };

  return (
    <div className={`feedback-card feedback-${status}`}>
      <div className="feedback-icon-box">
        <span>{iconMap[status]}</span>
      </div>
      <div className="feedback-body">
        <h4 className="feedback-title">{titleMap[status]}</h4>
        <p className="feedback-message">{message}</p>
        {error && (
          <div className="feedback-technical-error">
            <span className="error-badge">PostgreSQL Engine</span>
            <code>{error}</code>
          </div>
        )}
      </div>
    </div>
  );
};
