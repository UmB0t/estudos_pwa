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

  // Encontra o próximo exercício a fazer (primeiro não concluído)
  const nextUnfinishedExercise =
    exercises.find((ex) => {
      const prog = getExerciseProgress(ex.id);
      return !prog?.completed;
    }) ?? exercises[0];

  const overallPercentage = stats?.completionPercentage ?? 0;
  const completedCount = stats?.completedExercises ?? 0;
  const totalCount = stats?.totalExercises ?? exercises.length;

  const modules = [
    {
      id: 'select',
      title: 'Consultas Básicas (SELECT & DISTINCT)',
      description: 'Aprenda a projetar colunas, recuperar registros e eliminar duplicatas.',
      icon: '📐',
    },
    {
      id: 'alias',
      title: 'Renomeação de Colunas (AS)',
      description: 'Defina rótulos customizados para organizar o esquema e a semântica da saída.',
      icon: '🏷️',
    },
    {
      id: 'where',
      title: 'Filtros e Condições (WHERE)',
      description: 'Restrinja consultas aplicando operadores relacionais, lógicos (AND/OR) e IN.',
      icon: '🔍',
    },
  ];

  return (
    <div className="home-container">
      {/* HERO CARD - Estilo Vetor Azul Elétrico com Conic Gradient */}
      <section className="hero-card">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            <span>100% Client-Side • Sem Backend • PGlite WebAssembly</span>
          </div>
          <h1 className="hero-title">Laboratório de Estudos &amp; Prática Técnica</h1>
          <p className="hero-subtitle">
            Aprenda SQL PostgreSQL real direto no seu navegador. Zero configuração, validação semântica instantânea e histórico offline preservado.
          </p>

          <div className="hero-actions">
            {nextUnfinishedExercise && (
              <button
                className="btn btn-yel-action"
                onClick={() => onSelectExercise(nextUnfinishedExercise.id)}
              >
                <span>⚡ Continuar de onde parou</span>
                <span className="btn-arrow">→</span>
              </button>
            )}

            <div className="hero-stats-chips">
              <span className="chip">
                <strong>{completedCount}/{totalCount}</strong> concluídos
              </span>
              <span className="chip">
                <strong>{stats?.totalAttempts ?? 0}</strong> tentativas
              </span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div
            className="conic-ring"
            style={{
              background: `conic-gradient(var(--yel) ${overallPercentage * 3.6}deg, rgba(255, 255, 255, 0.22) 0deg)`,
            }}
          >
            <div className="conic-inner">
              <span className="conic-value">{overallPercentage}%</span>
              <span className="conic-label">DOMÍNIO</span>
            </div>
          </div>
          <div className="hero-visual-footer">
            <span>Progresso da Trilha SQL</span>
          </div>
        </div>
      </section>

      {/* SEÇÃO TRILHAS */}
      <section id="section-trilhas" className="tracks-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Trilhas de Aprendizado</h2>
            <p className="section-desc">Práticas focadas com engines emuladas ou reais rodando localmente.</p>
          </div>
        </div>

        <div className="tracks-grid">
          {/* Trilha SQL Ativa */}
          <div className="track-card track-sql">
            <div className="track-card-header">
              <div className="track-badge-group">
                <span className="track-symbol">🐘</span>
                <span className="badge badge-active">Trilha Ativa</span>
              </div>
              <span className="track-stats-num">{stats?.tracks['sql']?.completionPercentage ?? 0}%</span>
            </div>

            <h3 className="track-title">SQL (PostgreSQL 16)</h3>
            <p className="track-desc">
              Executado via PGlite WebAssembly. Transações somente leitura com rollback, datasets reais e feedback semântico.
            </p>

            <div className="track-progress-wrap">
              <div className="track-progress-bar">
                <div
                  className="track-progress-fill"
                  style={{ width: `${stats?.tracks['sql']?.completionPercentage ?? 0}%` }}
                />
              </div>
              <div className="track-progress-meta">
                <span>{stats?.tracks['sql']?.completedExercises ?? 0} de {stats?.tracks['sql']?.totalExercises ?? 8} exercícios concluídos</span>
              </div>
            </div>

            <div className="track-tags">
              <span className="mono-tag">#select</span>
              <span className="mono-tag">#where</span>
              <span className="mono-tag">#alias</span>
              <span className="mono-tag">#pglite</span>
            </div>
          </div>

          {/* Trilha Linux */}
          <div className="track-card track-linux">
            <div className="track-card-header">
              <div className="track-badge-group">
                <span className="track-symbol">🐧</span>
                <span className="badge badge-soon">Fase 2</span>
              </div>
            </div>
            <h3 className="track-title">Linux Shell &amp; Bash</h3>
            <p className="track-desc">
              Terminal virtual emulado em TypeScript com sistema de arquivos em memória (VFS), pipes, redirecionamentos e comandos essenciais.
            </p>
            <div className="track-tags">
              <span className="mono-tag">#terminal</span>
              <span className="mono-tag">#bash</span>
              <span className="mono-tag">#posix</span>
            </div>
          </div>

          {/* Trilha Docker */}
          <div className="track-card track-docker">
            <div className="track-card-header">
              <div className="track-badge-group">
                <span className="track-symbol">🐳</span>
                <span className="badge badge-soon">Fase 3</span>
              </div>
            </div>
            <h3 className="track-title">Docker CLI</h3>
            <p className="track-desc">
              Simulador de comandos Docker para construção de imagens, execução de containers e gerenciamento de volumes.
            </p>
            <div className="track-tags">
              <span className="mono-tag">#containers</span>
              <span className="mono-tag">#dockerfile</span>
            </div>
          </div>

          {/* Trilha Redes */}
          <div className="track-card track-network">
            <div className="track-card-header">
              <div className="track-badge-group">
                <span className="track-symbol">🌐</span>
                <span className="badge badge-soon">Fase 3</span>
              </div>
            </div>
            <h3 className="track-title">Redes de Computadores</h3>
            <p className="track-desc">
              Inspeção com curl, ping, portas, sockets conceituais e diagnóstico de rotas e topologia de rede.
            </p>
            <div className="track-tags">
              <span className="mono-tag">#curl</span>
              <span className="mono-tag">#dns</span>
              <span className="mono-tag">#http</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO MÓDULOS E LABORATÓRIOS */}
      <section id="section-exercicios" className="modules-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Laboratórios &amp; Exercícios SQL</h2>
            <p className="section-desc">
              Selecione qualquer exercício para começar. Não há bloqueios de acesso — pratique livremente!
            </p>
          </div>
        </div>

        {modules.map((mod) => {
          const modExercises = exercises.filter((ex) => ex.module === mod.id);
          const modStats = stats?.tracks['sql']?.modules[mod.id];
          const completedCount = modStats?.completedExercises ?? 0;
          const percentage = modStats?.completionPercentage ?? 0;

          return (
            <div key={mod.id} className="module-group">
              <div className="module-group-header">
                <div className="module-header-info">
                  <span className="module-icon">{mod.icon}</span>
                  <div>
                    <h3 className="module-heading">{mod.title}</h3>
                    <p className="module-desc">{mod.description}</p>
                  </div>
                </div>

                <div className="module-progress-chip">
                  <div className="module-bar">
                    <div className="module-bar-fill" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="module-stat-text">{completedCount}/{modExercises.length} ({percentage}%)</span>
                </div>
              </div>

              <div className="exercise-grid">
                {modExercises.map((ex) => {
                  const progress = getExerciseProgress(ex.id);
                  const isCompleted = progress?.completed ?? false;
                  const attemptsCount = progress?.attemptsCount ?? 0;

                  return (
                    <div
                      key={ex.id}
                      className={`exercise-card ${isCompleted ? 'is-completed' : ''}`}
                      onClick={() => onSelectExercise(ex.id)}
                    >
                      <div className="exercise-card-top">
                        <span className="level-badge">Nível {ex.level}</span>
                        <div className="status-badges">
                          {isCompleted ? (
                            <span className="badge-status-ok">✅ Concluído</span>
                          ) : attemptsCount > 0 ? (
                            <span className="badge-status-attempted">
                              🟡 {attemptsCount} {attemptsCount === 1 ? 'tentativa' : 'tentativas'}
                            </span>
                          ) : (
                            <span className="badge-status-open">Disponível</span>
                          )}
                          <span className={`difficulty-tag difficulty-${ex.difficulty}`}>
                            {ex.difficulty}
                          </span>
                        </div>
                      </div>

                      <h4 className="exercise-card-title">{ex.title}</h4>
                      <p className="exercise-card-desc">
                        {ex.question.length > 95 ? `${ex.question.substring(0, 95)}...` : ex.question}
                      </p>

                      <div className="exercise-card-footer">
                        <div className="exercise-tags">
                          {ex.skills.map((s, idx) => (
                            <span key={idx} className="mono-skill">
                              #{s}
                            </span>
                          ))}
                        </div>
                        <span className="exercise-enter-btn">Praticar →</span>
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
