import React from 'react';
import type { PublicExercise } from '@lab/shared';
import { getPublicExercises } from '../content';
import { useProgression } from '../context/ProgressionContext';

interface HomePageProps {
  onSelectExercise: (exerciseId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectExercise }) => {
  const exercises: PublicExercise[] = getPublicExercises();
  const { stats, getExerciseProgress } = useProgression();

  // Agrupa os exercícios por módulo
  const modules = [
    {
      id: 'select',
      title: 'Consultas Básicas (SELECT & DISTINCT)',
      description: 'Aprenda a projetar colunas, buscar dados e eliminar valores repetidos.',
    },
    {
      id: 'alias',
      title: 'Renomeação de Colunas (AS)',
      description: 'Defina rótulos customizados e organize o esquema de saída.',
    },
    {
      id: 'where',
      title: 'Filtros e Condições (WHERE)',
      description: 'Restrinja resultados utilizando operadores de comparação, AND e IN.',
    },
  ];

  return (
    <div className="home-container">
      <section className="hero">
        <h1>Laboratório de Estudos Técnicos</h1>
        <p>
          Ambiente prático, 100% executado localmente no seu navegador via WebAssembly.
          Sem servidores externos, sem containers e com feedback semântico instantâneo.
        </p>
      </section>

      <section className="tracks-grid">
        <div className="track-card active">
          <div className="track-header">
            <span className="track-icon">🐘</span>
            <span className="badge active">Ativa</span>
          </div>
          <h3>SQL (PostgreSQL)</h3>
          <p>
            Executado de verdade no navegador com PGlite (WASM). Validação semântica e datasets reais.
          </p>
          {stats?.tracks['sql'] && (
            <div className="track-progress-info">
              <div className="track-progress-bar">
                <div
                  className="track-progress-fill"
                  style={{ width: `${stats.tracks['sql'].completionPercentage}%` }}
                />
              </div>
              <span className="track-progress-text">
                {stats.tracks['sql'].completedExercises} de {stats.tracks['sql'].totalExercises} concluídos ({stats.tracks['sql'].completionPercentage}%)
              </span>
            </div>
          )}
        </div>

        <div className="track-card">
          <div className="track-header">
            <span className="track-icon">🐧</span>
            <span className="badge soon">Em breve</span>
          </div>
          <h3>Linux Shell</h3>
          <p>Terminal virtual emulado em TypeScript com sistema de arquivos em memória (Fase 2).</p>
        </div>

        <div className="track-card">
          <div className="track-header">
            <span className="track-icon">🐳</span>
            <span className="badge soon">Em breve</span>
          </div>
          <h3>Docker CLI</h3>
          <p>Simulador de CLI para comandos de criação de imagens e execução de containers (Fase 3).</p>
        </div>

        <div className="track-card">
          <div className="track-header">
            <span className="track-icon">🌐</span>
            <span className="badge soon">Em breve</span>
          </div>
          <h3>Redes de Computadores</h3>
          <p>Inspeção com curl, ping, portas e testes conceituais de topologia (Fase 3).</p>
        </div>
      </section>

      <section className="modules-section">
        <h2>Trilha SQL: Módulos de Aprendizado</h2>

        {modules.map((mod) => {
          const modExercises = exercises.filter((ex) => ex.module === mod.id);
          const modStats = stats?.tracks['sql']?.modules[mod.id];
          const completedCount = modStats?.completedExercises ?? 0;
          const percentage = modStats?.completionPercentage ?? 0;

          return (
            <div key={mod.id} className="module-group">
              <div className="module-header-row">
                <div className="module-title">
                  <span>📁</span>
                  <span>{mod.title}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    ({completedCount}/{modExercises.length} concluídos)
                  </span>
                </div>

                <div className="module-mini-progress">
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="progress-percentage-label">{percentage}%</span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {mod.description}
              </p>

              <div className="exercise-list">
                {modExercises.map((ex) => {
                  const progress = getExerciseProgress(ex.id);
                  const isCompleted = progress?.completed ?? false;
                  const attemptsCount = progress?.attemptsCount ?? 0;

                  return (
                    <div
                      key={ex.id}
                      className={`exercise-item ${isCompleted ? 'completed-item' : ''}`}
                      onClick={() => onSelectExercise(ex.id)}
                    >
                      <div>
                        <div className="exercise-item-header">
                          <span className="exercise-level">Nível {ex.level}</span>
                          <div className="exercise-status-badges">
                            {isCompleted ? (
                              <span className="exercise-status-badge completed">
                                ✅ Concluído
                              </span>
                            ) : attemptsCount > 0 ? (
                              <span className="exercise-status-badge attempted">
                                🟡 {attemptsCount} {attemptsCount === 1 ? 'tentativa' : 'tentativas'}
                              </span>
                            ) : null}
                            <span className={`exercise-difficulty difficulty-${ex.difficulty}`}>
                              {ex.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="exercise-title">{ex.title}</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {ex.question.length > 90 ? `${ex.question.substring(0, 90)}...` : ex.question}
                        </p>
                      </div>

                      <div className="exercise-skills">
                        {ex.skills.map((s, idx) => (
                          <span key={idx} className="skill-tag">
                            #{s}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
