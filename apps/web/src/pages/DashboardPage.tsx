import React, { useState, useMemo } from 'react';
import { useProgression } from '../context/ProgressionContext';
import {
  TRACKS_CATALOG,
  getAllGuidedLessons,
} from '../content/guidedContent';

interface DashboardPageProps {
  onSelectLesson: (lessonId: string) => void;
  onOpenTrack: (trackCode: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectLesson,
  onOpenTrack,
}) => {
  const { currentProfile, stats, getExerciseProgress } = useProgression();
  const [searchQuery, setSearchQuery] = useState('');

  const allLessons = useMemo(() => getAllGuidedLessons(), []);

  // Encontra a aula em andamento (primeira lição não concluída)
  const currentUnfinishedLesson = useMemo(() => {
    return (
      allLessons.find((lesson) => {
        const prog = getExerciseProgress(lesson.exerciseId || lesson.id);
        return !prog?.completed;
      }) ?? allLessons[0]!
    );
  }, [allLessons, getExerciseProgress]);

  // Estatísticas gerais
  const overallPercentage = stats?.completionPercentage ?? 0;
  const completedCount = stats?.completedExercises ?? 0;
  const totalCount = stats?.totalExercises ?? allLessons.length;

  // Filtragem em tempo real das trilhas
  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return TRACKS_CATALOG;
    return TRACKS_CATALOG.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Dados do gráfico de horas estudadas na semana
  const weeklyHours = [
    { day: 'Seg', hours: 1.8, height: 50 },
    { day: 'Ter', hours: 2.6, height: 75 },
    { day: 'Qua', hours: 1.2, height: 35 },
    { day: 'Qui', hours: 3.4, height: 95 },
    { day: 'Sex', hours: 2.8, height: 80 },
    { day: 'Sáb', hours: 1.9, height: 55 },
    { day: 'Dom', hours: 0.9, height: 28 },
  ];
  const totalWeekHours = weeklyHours
    .reduce((acc, cur) => acc + cur.hours, 0)
    .toFixed(1);

  // Matriz do Heatmap (7 dias x 12 semanas = 84 blocos)
  const heatmapBlocks = useMemo(() => {
    const blocks: { id: number; level: number; dateLabel: string; activityCount: number }[] = [];
    // Níveis de 0 a 4 simulando atividade realista
    const levelsPattern = [
      0, 1, 2, 3, 2, 0, 1, 3, 4, 2, 1, 0, 2, 3, 4, 4, 3, 1, 0, 1, 2, 3, 4, 2,
      1, 2, 3, 1, 0, 2, 3, 4, 3, 2, 1, 0, 1, 3, 4, 2, 3, 4, 1, 2, 3, 0, 2, 4,
      3, 1, 2, 4, 3, 2, 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 2, 3, 4, 3, 2, 1, 2, 4,
      3, 2, 1, 0, 2, 3, 4, 3, 2, 4, 3, 4,
    ];

    for (let i = 0; i < 84; i++) {
      const lvl = levelsPattern[i % levelsPattern.length] ?? 0;
      blocks.push({
        id: i,
        level: lvl,
        dateLabel: `Dia ${i + 1}`,
        activityCount: lvl === 0 ? 0 : lvl * 3 + 1,
      });
    }
    return blocks;
  }, []);

  // Badges de Conquistas
  const achievements = [
    {
      id: 'streak-14',
      icon: '🔥',
      title: '14d Sequência',
      desc: '14 dias consecutivos de estudo ativo',
      unlocked: true,
    },
    {
      id: 'sql-100',
      icon: '⚡',
      title: '100 consultas SQL',
      desc: 'Mais de 100 queries executadas no PGlite',
      unlocked: true,
    },
    {
      id: 'labs-10',
      icon: '🧪',
      title: '10 laboratórios',
      desc: '10 desafios práticos validados',
      unlocked: true,
    },
    {
      id: 'indexes-master',
      icon: '🎯',
      title: 'Mestre de Índices',
      desc: 'Otimização com índices B-Tree e scans',
      unlocked: false,
      progress: '70%',
    },
    {
      id: 'sec-guard',
      icon: '🛡️',
      title: 'Guarda de Injeção',
      desc: 'Mitigação completa de SQL Injection',
      unlocked: false,
    },
    {
      id: 'cloud-deploy',
      icon: '☁️',
      title: 'Container Pro',
      desc: 'Gerenciamento avançado de Docker',
      unlocked: false,
    },
  ];

  return (
    <div className="dashboard-page-container">
      {/* 1. Cabeçalho de Boas-Vindas */}
      <header className="dashboard-welcome-header">
        <div className="welcome-meta-left">
          <h1 className="welcome-title">
            Bom estudo, {currentProfile?.name ?? 'Estudante'}!
          </h1>
          <p className="welcome-pending-counter">
            <span className="pending-highlight">3 revisões</span> de flashcards e{' '}
            <span className="pending-highlight">2 aulas</span> pendentes para hoje.
          </p>
        </div>

        {/* Campo de Busca em Tempo Real */}
        <div className="welcome-search-wrap">
          <div className="search-input-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Filtrar trilhas em tempo real (ex: DB-201, Linux)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section (2 Colunas) */}
      <section className="dashboard-hero-grid">
        {/* Card Esquerdo: Continuar de onde parou */}
        <div className="hero-resume-card">
          <div className="resume-content-left">
            <div className="resume-badge-row">
              <span className="resume-status-dot" />
              <span className="resume-badge-text">Continuar de onde parou</span>
            </div>

            <span className="resume-track-code">
              {currentUnfinishedLesson.trackCode} · {currentUnfinishedLesson.moduleTitle}
            </span>

            <h2 className="resume-lesson-title">
              {currentUnfinishedLesson.title}
            </h2>

            <p className="resume-meta-info">
              ⏱️ {currentUnfinishedLesson.readTimeMin} min · Passo 1: Teoria & Conceitos
            </p>

            <button
              type="button"
              className="btn-resume-solar"
              onClick={() => onSelectLesson(currentUnfinishedLesson.id)}
            >
              <span className="solar-play-icon">▶</span>
              <span>Retomar aula</span>
            </button>
          </div>

          {/* Anel Circular de Progresso em Gradiente Cônico */}
          <div className="resume-progress-visual">
            <div
              className="hero-conic-ring"
              style={{
                background: `conic-gradient(#FFC83D ${overallPercentage}%, rgba(255, 255, 255, 0.15) ${overallPercentage}% 100%)`,
              }}
            >
              <div className="hero-conic-inner">
                <span className="conic-percent-number">{overallPercentage}%</span>
                <span className="conic-percent-label">DOMINADO</span>
              </div>
            </div>
            <span className="conic-fraction-label">
              {completedCount} de {totalCount} aulas
            </span>
          </div>
        </div>

        {/* Card Direito: Horas estudadas na semana */}
        <div className="hero-hours-card">
          <div className="hours-card-header">
            <div>
              <h3 className="hours-card-title">Horas estudadas na semana</h3>
              <span className="hours-total-metric">{totalWeekHours}h no total</span>
            </div>
            <span className="hours-weekly-badge">Meta 12h: Superada!</span>
          </div>

          {/* Gráfico de Barras Verticais */}
          <div className="weekly-bars-chart">
            {weeklyHours.map((item, idx) => (
              <div key={idx} className="bar-column">
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ height: `${item.height}%` }}
                    title={`${item.day}: ${item.hours}h`}
                  >
                    <span className="bar-value-tooltip">{item.hours}h</span>
                  </div>
                </div>
                <span className="bar-day-label">{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Grid "Suas Trilhas" */}
      <section className="dashboard-tracks-section">
        <div className="section-title-bar">
          <div>
            <h2 className="section-heading">Suas Trilhas de Aprendizado</h2>
            <p className="section-subtext">
              Formações técnicas orientadas à prática com laboratórios e teoria estruturada.
            </p>
          </div>
          {searchQuery && (
            <span className="search-results-pill">
              {filteredTracks.length} trilha{filteredTracks.length === 1 ? '' : 's'} encontrada{filteredTracks.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div className="tracks-solid-grid">
          {filteredTracks.map((track) => {
            const trackCompleted = track.lessons.filter((l) => {
              const p = getExerciseProgress(l.exerciseId || l.id);
              return p?.completed;
            }).length;
            const pct = Math.round((trackCompleted / track.lessons.length) * 100);

            return (
              <div
                key={track.code}
                className="track-vetor-card"
                style={
                  {
                    '--track-c': track.accentColor,
                    boxShadow: `4px 4px 0 ${track.accentColor}`,
                  } as React.CSSProperties
                }
                onClick={() => onOpenTrack(track.code)}
              >
                <div className="track-card-top-row">
                  <span className="track-code-tag">{track.code}</span>
                  <span className="track-hours-tag">{track.totalHours}</span>
                </div>

                <h3 className="track-card-title">{track.name}</h3>
                <p className="track-card-summary">{track.summary}</p>

                {/* Barra de Progresso Colorida */}
                <div className="track-card-progress-wrap">
                  <div className="track-card-progress-bar">
                    <div
                      className="track-card-progress-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: track.accentColor,
                      }}
                    />
                  </div>
                  <div className="track-card-meta-row">
                    <span className="track-counter-text">
                      {trackCompleted} de {track.lessons.length} aulas · {pct}%
                    </span>
                    <span className="track-open-arrow">Abrir ementa ➔</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Seção "Seu Ritmo" */}
      <section className="dashboard-rhythm-section">
        <div className="section-title-bar">
          <div>
            <h2 className="section-heading">Seu Ritmo &amp; Hábitos</h2>
            <p className="section-subtext">
              Acompanhamento de consistência diária e conquistas alcançadas.
            </p>
          </div>
        </div>

        <div className="rhythm-grid-layout">
          {/* Constância de Estudo: Heatmap Estilo GitHub (84 Blocos 7x12) */}
          <div className="heatmap-card">
            <div className="heatmap-header">
              <div className="heatmap-title-wrap">
                <span className="heatmap-icon">📅</span>
                <h3 className="heatmap-title">Constância de Estudo (Últimas 12 Semanas)</h3>
              </div>
              <span className="heatmap-streak-badge">14 dias seguidos</span>
            </div>

            <div className="heatmap-matrix-grid">
              {heatmapBlocks.map((blk) => (
                <div
                  key={blk.id}
                  className={`heatmap-cell lvl-${blk.level}`}
                  title={`${blk.dateLabel}: ${blk.activityCount} exercícios/consultas realizadas`}
                />
              ))}
            </div>

            {/* Legenda Explicativa de Intensidade */}
            <div className="heatmap-legend-row">
              <span className="legend-label">Menos</span>
              <div className="legend-cells">
                <span className="heatmap-cell lvl-0" />
                <span className="heatmap-cell lvl-1" />
                <span className="heatmap-cell lvl-2" />
                <span className="heatmap-cell lvl-3" />
                <span className="heatmap-cell lvl-4" />
              </div>
              <span className="legend-label">Mais</span>
            </div>
          </div>

          {/* Conquistas / Badges */}
          <div className="achievements-card">
            <div className="achievements-header">
              <span className="achievements-icon">🏆</span>
              <h3 className="achievements-title">Conquistas &amp; Badges</h3>
            </div>

            <div className="achievements-list">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`achievement-item ${
                    ach.unlocked ? 'unlocked' : 'locked'
                  }`}
                >
                  <div className="achievement-icon-circle">
                    <span>{ach.icon}</span>
                  </div>
                  <div className="achievement-details">
                    <div className="achievement-title-row">
                      <h4 className="achievement-item-title">{ach.title}</h4>
                      {ach.unlocked ? (
                        <span className="badge-unlocked-tag">Desbloqueado</span>
                      ) : ach.progress ? (
                        <span className="badge-progress-tag">{ach.progress}</span>
                      ) : (
                        <span className="badge-locked-tag">Bloqueado</span>
                      )}
                    </div>
                    <p className="achievement-desc">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
