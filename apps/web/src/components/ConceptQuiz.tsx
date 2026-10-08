import React, { useState } from 'react';
import type { QuizQuestion } from '../content/guidedContent';

interface ConceptQuizProps {
  questions: QuizQuestion[];
  onQuizCompleted?: () => void;
}

export const ConceptQuiz: React.FC<ConceptQuizProps> = ({
  questions,
  onQuizCompleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState(false);

  const currentQ = questions[currentIndex] ?? questions[0];
  if (!currentQ) {
    return null;
  }
  const selectedOption = selectedAnswers[currentIndex];
  const isAnswered = selectedOption !== undefined;
  const isCorrect = isAnswered && selectedOption === currentQ.correctIndex;

  const handleSelectOption = (optIdx: number) => {
    if (isAnswered) return; // Mantém a resposta inicial com feedback pedagógico

    const nextAnswers = { ...selectedAnswers, [currentIndex]: optIdx };
    setSelectedAnswers(nextAnswers);

    // Checa se todas as perguntas foram respondidas
    const answeredCount = Object.keys(nextAnswers).length;
    if (answeredCount === questions.length && !hasNotifiedCompletion) {
      setHasNotifiedCompletion(true);
      if (onQuizCompleted) {
        onQuizCompleted();
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="concept-quiz-card">
      <div className="quiz-header">
        <div className="quiz-title-wrap">
          <span className="quiz-badge">🧠 Fixação</span>
          <h4 className="quiz-heading">Mini-Quiz Conceitual</h4>
        </div>

        {/* Navegação por Pontinhos (.dots) */}
        <div className="quiz-dots">
          {questions.map((q, idx) => {
            const answered = selectedAnswers[idx] !== undefined;
            const correct = answered && selectedAnswers[idx] === q.correctIndex;
            const isCurrent = idx === currentIndex;

            let dotClass = 'dot';
            if (isCurrent) dotClass += ' active';
            if (answered) {
              dotClass += correct ? ' correct' : ' wrong';
            }

            return (
              <button
                key={q.id}
                type="button"
                className={dotClass}
                onClick={() => setCurrentIndex(idx)}
                title={`Pergunta ${idx + 1}`}
                aria-label={`Ir para pergunta ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>

      <div className="quiz-body">
        <div className="quiz-question-meta">
          <span className="quiz-counter">
            Questão {currentIndex + 1} de {questions.length}
          </span>
        </div>

        <p className="quiz-question-text">{currentQ.question}</p>

        {/* Lista de Opções Clicáveis */}
        <div className="quiz-options-list">
          {currentQ.options.map((opt, optIdx) => {
            const isSelected = selectedOption === optIdx;
            const isThisCorrect = optIdx === currentQ.correctIndex;

            let optionClass = 'quiz-option-btn';
            if (isAnswered) {
              if (isSelected && isThisCorrect) {
                optionClass += ' option-correct';
              } else if (isSelected && !isThisCorrect) {
                optionClass += ' option-wrong';
              } else if (!isSelected && isThisCorrect) {
                optionClass += ' option-expected';
              }
            }

            return (
              <button
                key={optIdx}
                type="button"
                className={optionClass}
                onClick={() => handleSelectOption(optIdx)}
                disabled={isAnswered}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <span className="option-text">{opt}</span>
                {isAnswered && isThisCorrect && (
                  <span className="option-status-icon">✓</span>
                )}
                {isAnswered && isSelected && !isThisCorrect && (
                  <span className="option-status-icon">✕</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Explicativo Imediato */}
        {isAnswered && (
          <div
            className={`quiz-feedback-box ${
              isCorrect ? 'feedback-ok' : 'feedback-error'
            }`}
          >
            <div className="feedback-badge-row">
              <span className="feedback-result-title">
                {isCorrect ? '🎉 Resposta Correta!' : '💡 Atenção ao Conceito:'}
              </span>
            </div>
            <p className="feedback-explanation-text">{currentQ.explanation}</p>
          </div>
        )}

        {/* Controles de Navegação */}
        <div className="quiz-nav-row">
          <button
            type="button"
            className="quiz-nav-btn prev"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            ← Anterior
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              className="quiz-nav-btn next"
              onClick={handleNext}
              disabled={!isAnswered}
            >
              Próxima Questão →
            </button>
          ) : (
            <span className="quiz-completed-badge">
              {isAnswered ? '✓ Todas as questões respondidas!' : 'Selecione uma opção'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
