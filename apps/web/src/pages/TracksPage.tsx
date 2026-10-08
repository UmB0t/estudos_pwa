import React, { useState } from 'react';
import { useProgression } from '../context/ProgressionContext';
import {
  TRACKS_CATALOG,
  type TrackDefinition,
} from '../content/guidedContent';

interface TracksPageProps {
  onSelectLesson: (lessonId: string) => void;
  onBackToDashboard: () => void;
  initialTrackCode?: string;
}

export const TracksPage: React.FC<TracksPageProps> = ({
  onSelectLesson,
  onBackToDashboard,
  initialTrackCode,
}) => {
  const { getExerciseProgress } = useProgression();
  const [selectedTrackCode, setSelectedTrackCode] = useState<string>(
    initialTrackCode || TRACKS_CATALOG[0]!.code
  );

  const activeTrack: TrackDefinition =
    TRACKS_CATALOG.find((t) => t.code === selectedTrackCode) ?? TRACKS_CATALOG[0]!;

  const handleStartTrack = (track: TrackDefinition) => {
    // Procura a primeira aula não concluída
    const firstUnfinished =
      track.lessons.find((l) => {
        const p = getExerciseProgress(l.exerciseId || l.id);
        return !p?.completed;
      }) ?? track.lessons[0]!;

    onSelectLesson(firstUnfinished.id);
  };

  return (
    <div className="tracks-page-container">
      {/* Cabeçalho */}
      <header className="tracks-page-header">
        <div>
          <button
            type="button"
            className="tracks-back-link"
            onClick={onBackToDashboard}
          >
            ← Voltar ao Painel
          </button>
          <h1 className="tracks-page-title">Trilhas de Especialização</h1>
          <p className="tracks-page-subtitle">
            Currículo estruturado por competências técnicas fundamentais com laboratórios aplicados.
          </p>
        </div>
      </header>

      {/* Seletor Superior de Trilhas (Pílulas / Abas) */}
      <div className="tracks-selector-pills">
        {TRACKS_CATALOG.map((track) => {
          const isSelected = track.code === activeTrack.code;
          const completedCount = track.lessons.filter((l) => {
            const p = getExerciseProgress(l.exerciseId || l.id);
            return p?.completed;
          }).length;
          const pct = Math.round((completedCount / track.lessons.length) * 100);

          return (
            <button
              key={track.code}
              type="button"
              className={`track-pill-item ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedTrackCode(track.code)}
            >
              <span className="pill-code">{track.code}</span>
              <span className="pill-name">{track.name}</span>
              <span className="pill-pct">{pct}%</span>
            </button>
          );
        })}
      </div>

      {/* Visão Detalhada da Trilha Selecionada */}
      <section className="track-detail-card">
        <div className="track-detail-header-row">
          <div className="track-detail-meta">
            <div className="track-tags-badges">
              <span className="track-code-highlight">{activeTrack.code}</span>
              <span className="track-badge-highlight">{activeTrack.badge}</span>
              <span className="track-hours-highlight">{activeTrack.totalHours}</span>
            </div>
            <h2 className="track-detail-title">{activeTrack.name}</h2>
            <p className="track-detail-summary">{activeTrack.summary}</p>
          </div>

          <div className="track-action-box">
            <button
              type="button"
              className="btn btn-yel-action"
              onClick={() => handleStartTrack(activeTrack)}
            >
              Iniciar ou Continuar Trilha ➔
            </button>
          </div>
        </div>

        {/* Ementa Completa de Aulas da Trilha */}
        <div className="track-syllabus-section">
          <h3 className="syllabus-section-title">Ementa Completa de Aulas ({activeTrack.lessons.length} aulas)</h3>

          <div className="syllabus-lessons-grid">
            {activeTrack.lessons.map((lesson, idx) => {
              const prog = getExerciseProgress(lesson.exerciseId || lesson.id);
              const isDone = Boolean(prog?.completed);

              return (
                <div
                  key={lesson.id}
                  className={`syllabus-lesson-card ${isDone ? 'is-done' : ''}`}
                  onClick={() => onSelectLesson(lesson.id)}
                >
                  <div className="lesson-card-top">
                    <span className="lesson-order-tag">
                      Aula {String(idx + 1).padStart(2, '0')}
                    </span>
                    {isDone ? (
                      <span className="badge-ok-pill">✓ Concluído</span>
                    ) : (
                      <span className="badge-open-pill">Pendente</span>
                    )}
                  </div>

                  <h4 className="lesson-card-heading">{lesson.title}</h4>
                  <p className="lesson-card-module">{lesson.moduleTitle}</p>

                  <div className="lesson-card-footer">
                    <span className="lesson-read-time">
                      ⏱️ {lesson.readTimeMin} min de leitura
                    </span>
                    <span className="lesson-card-arrow">Acessar aula ➔</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
