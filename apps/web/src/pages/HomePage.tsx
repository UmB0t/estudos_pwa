import React, { useState } from 'react';
import type { PublicExercise, ExerciseTrack } from '@lab/shared';
import { getPublicExercises } from '../content';
import { useProgression } from '../context/ProgressionContext';

interface HomePageProps {
  onSelectExercise: (exerciseId: string) => void;
}

interface ModuleMeta {
  id: string;
  track: ExerciseTrack;
  title: string;
  description: string;
  icon: string;
}

const MODULES_META: ModuleMeta[] = [
  // SQL
  {
    id: 'select',
    track: 'sql',
    title: 'Consultas Básicas (SELECT & DISTINCT)',
    description: 'Aprenda a projetar colunas, recuperar registros e eliminar duplicatas.',
    icon: '📐',
  },
  {
    id: 'alias',
    track: 'sql',
    title: 'Renomeação de Colunas (AS)',
    description: 'Defina rótulos customizados para organizar o esquema e a semântica da saída.',
    icon: '🏷️',
  },
  {
    id: 'where',
    track: 'sql',
    title: 'Filtros e Condições (WHERE)',
    description: 'Restrinja consultas aplicando operadores relacionais, lógicos e listas.',
    icon: '🔍',
  },
  // Linux
  {
    id: 'navegacao',
    track: 'linux',
    title: 'Navegação no Sistema de Arquivos',
    description: 'Explore diretórios, inspecione caminhos e domine comandos essenciais de movimentação.',
    icon: '🧭',
  },
  {
    id: 'arquivos',
    track: 'linux',
    title: 'Manipulação de Pastas e Arquivos',
    description: 'Crie estruturas de pastas, manipule arquivos e direcione fluxos com redirecionamentos.',
    icon: '📁',
  },
  {
    id: 'inspecao',
    track: 'linux',
    title: 'Inspeção e Busca de Texto',
    description: 'Exiba conteúdos e filtre informações em arquivos com buscas por padrões.',
    icon: '🔎',
  },
  // Docker
  {
    id: 'containers',
    track: 'docker',
    title: 'Gerenciamento de Containers',
    description: 'Liste instâncias, inicialize serviços isolados e mapeie portas do host.',
    icon: '📦',
  },
  {
    id: 'diagnostico-docker',
    track: 'docker',
    title: 'Logs e Monitoramento Docker',
    description: 'Acompanhe saídas de processos e verifique o estado operacional de containers.',
    icon: '📊',
  },
  // Networks
  {
    id: 'diagnostico',
    track: 'networks',
    title: 'Conectividade e Protocolos de Rede',
    description: 'Teste alcance com ping e realize requisições cliente com cURL.',
    icon: '⚡',
  },
  {
    id: 'sockets',
    track: 'networks',
    title: 'Portas e Sockets de Rede',
    description: 'Inspecione portas em escuta no sistema operacional e identifique serviços ativos.',
    icon: '🔌',
  },
];

export const HomePage: React.FC<HomePageProps> = ({ onSelectExercise }) => {
  const exercises: PublicExercise[] = getPublicExercises();
  const { stats, getExerciseProgress } = useProgression();
  const [selectedTrack, setSelectedTrack] = useState<ExerciseTrack | 'all'>('all');

  // Encontra o próximo exercício a fazer (primeiro não concluído)
  const nextUnfinishedExercise =
    exercises.find((ex) => {
      const prog = getExerciseProgress(ex.id);
      return !prog?.completed;
    }) ?? exercises[0];

  const overallPercentage = stats?.completionPercentage ?? 0;
  const completedCount = stats?.completedExercises ?? 0;
  const totalCount = stats?.totalExercises ?? exercises.length;

  const filteredExercises =
    selectedTrack === 'all'
      ? exercises
      : exercises.filter((ex) => ex.track === selectedTrack);

  const filteredModules = MODULES_META.filter((mod) => {
    if (selectedTrack !== 'all' && mod.track !== selectedTrack) {
      return false;
    }
    return exercises.some((ex) => ex.track === mod.track && (ex.module === mod.id || (mod.id === 'diagnostico-docker' && ex.track === 'docker' && ex.module === 'diagnostico')));
  });

  const getTrackStats = (trackKey: ExerciseTrack) => {
    const trackExercises = exercises.filter((e) => e.track === trackKey);
    const completed = trackExercises.filter((e) => getExerciseProgress(e.id)?.completed).length;
    const percentage = trackExercises.length > 0 ? Math.round((completed / trackExercises.length) * 100) : 0;
    return { completed, total: trackExercises.length, percentage };
  };

  const sqlStats = getTrackStats('sql');
  const linuxStats = getTrackStats('linux');
  const dockerStats = getTrackStats('docker');
  const networkStats = getTrackStats('networks');

  const handleTrackCardClick = (trackKey: ExerciseTrack) => {
    setSelectedTrack(trackKey);
    const sectionEl = document.getElementById('section-exercicios');
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-container">
      {/* HERO CARD - Estilo Vetor Azul Elétrico */}
      <section className="hero-card">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            <span>Prática 100% Interativa • Ambiente Local • Zero Configuração</span>
          </div>
          <h1 className="hero-title">Seu Espaço de Prática e Aprendizado Técnico</h1>
          <p className="hero-subtitle">
            Desenvolva habilidades sólidas praticando comandos e conceitos técnicos reais. Feedback imediato, ambiente seguro e histórico salvo localmente no seu navegador.
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
            <span>Progresso Geral dos Estudos</span>
          </div>
        </div>
      </section>

      {/* SEÇÃO TRILHAS (Todas Interativas e Clicáveis) */}
      <section id="section-trilhas" className="tracks-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Trilhas de Aprendizado</h2>
            <p className="section-desc">
              Escolha uma trilha técnica para filtrar os exercícios e focar na sua prática.
            </p>
          </div>
        </div>

        <div className="tracks-grid">
          {/* Trilha SQL */}
          <div
            className={`track-card track-sql ${selectedTrack === 'sql' ? 'is-selected-track' : ''}`}
            onClick={() => handleTrackCardClick('sql')}
            role="button"
            tabIndex={0}
          >
            <div className="track-card-header">
              <div className="track-badge-group">
                <span className="track-symbol">🐘</span>
                <span className="badge badge-active">Trilha Prática</span>
              </div>
              <span className="track-stats-num">{sqlStats.percentage}%</span>
            </div>

            <h3 className="track-title">SQL (PostgreSQL 16)</h3>
            <p className="track-desc">
              Domine consultas, filtros, renomeação de colunas e manipulação de dados com PostgreSQL.
            </p>

            <div className="track-progress-wrap">
              <div className="track-progress-bar">
                <div className="track-progress-fill" style={{ width: `${sqlStats.percentage}%` }} />
              </div>
              <div className="track-progress-meta">
                <span>{sqlStats.completed} de {sqlStats.total} exercícios concluídos</span>
              </div>
            </div>
          </div>

          {/* Trilha Linux */}
          <div
            className={`track-card track-linux ${selectedTrack === 'linux' ? 'is-selected-track' : ''}`}
            onClick={() => handleTrackCardClick('linux')}
            role="button"
            tabIndex={0}
          >
            <div className="track-card-header">
              <div className="track-badge-group">
                <span className="track-symbol">🐧</span>
                <span className="badge badge-active">Trilha Prática</span>
              </div>
              <span className="track-stats-num">{linuxStats.percentage}%</span>
            </div>

            <h3 className="track-title">Linux Shell &amp; Bash</h3>
            <p className="track-desc">
              Aprenda navegação no sistema de arquivos, criação de pastas, manipulação de arquivos e busca de texto.
            </p>

            <div className="track-progress-wrap">
              <div className="track-progress-bar">
                <div
                  className="track-progress-fill fill-linux"
                  style={{ width: `${linuxStats.percentage}%`, backgroundColor: '#0E8F67' }}
                />
              </div>
              <div className="track-progress-meta">
                <span>{linuxStats.completed} de {linuxStats.total} exercícios concluídos</span>
              </div>
            </div>
          </div>

          {/* Trilha Docker */}
          <div
            className={`track-card track-docker ${selectedTrack === 'docker' ? 'is-selected-track' : ''}`}
            onClick={() => handleTrackCardClick('docker')}
            role="button"
            tabIndex={0}
          >
            <div className="track-card-header">
              <div className="track-badge-group">
                <span className="track-symbol">🐳</span>
                <span className="badge badge-active">Trilha Prática</span>
              </div>
              <span className="track-stats-num">{dockerStats.percentage}%</span>
            </div>

            <h3 className="track-title">Docker CLI</h3>
            <p className="track-desc">
              Gerencie containers, execute servidores isolados e inspecione logs de execução no terminal.
            </p>

            <div className="track-progress-wrap">
              <div className="track-progress-bar">
                <div
                  className="track-progress-fill fill-docker"
                  style={{ width: `${dockerStats.percentage}%`, backgroundColor: '#0284C7' }}
                />
              </div>
              <div className="track-progress-meta">
                <span>{dockerStats.completed} de {dockerStats.total} exercícios concluídos</span>
              </div>
            </div>
          </div>

          {/* Trilha Redes */}
          <div
            className={`track-card track-network ${selectedTrack === 'networks' ? 'is-selected-track' : ''}`}
            onClick={() => handleTrackCardClick('networks')}
            role="button"
            tabIndex={0}
          >
            <div className="track-card-header">
              <div className="track-badge-group">
                <span className="track-symbol">🌐</span>
                <span className="badge badge-active">Trilha Prática</span>
              </div>
              <span className="track-stats-num">{networkStats.percentage}%</span>
            </div>

            <h3 className="track-title">Redes de Computadores</h3>
            <p className="track-desc">
              Diagnostique conectividade com ping, teste serviços web com cURL e inspecione portas ativas.
            </p>

            <div className="track-progress-wrap">
              <div className="track-progress-bar">
                <div
                  className="track-progress-fill fill-network"
                  style={{ width: `${networkStats.percentage}%`, backgroundColor: '#8B5CF6' }}
                />
              </div>
              <div className="track-progress-meta">
                <span>{networkStats.completed} de {networkStats.total} exercícios concluídos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO MÓDULOS E LABORATÓRIOS */}
      <section id="section-exercicios" className="modules-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Laboratórios &amp; Exercícios Práticos</h2>
            <p className="section-desc">
              Selecione qualquer exercício para começar. Todos os laboratórios estão desbloqueados para prática livre.
            </p>
          </div>

          {/* Filtro de Trilhas */}
          <div className="track-tabs">
            <button
              className={`track-tab ${selectedTrack === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTrack('all')}
            >
              Todas ({exercises.length})
            </button>
            <button
              className={`track-tab ${selectedTrack === 'sql' ? 'active' : ''}`}
              onClick={() => setSelectedTrack('sql')}
            >
              🐘 SQL ({sqlStats.total})
            </button>
            <button
              className={`track-tab ${selectedTrack === 'linux' ? 'active' : ''}`}
              onClick={() => setSelectedTrack('linux')}
            >
              🐧 Linux ({linuxStats.total})
            </button>
            <button
              className={`track-tab ${selectedTrack === 'docker' ? 'active' : ''}`}
              onClick={() => setSelectedTrack('docker')}
            >
              🐳 Docker ({dockerStats.total})
            </button>
            <button
              className={`track-tab ${selectedTrack === 'networks' ? 'active' : ''}`}
              onClick={() => setSelectedTrack('networks')}
            >
              🌐 Redes ({networkStats.total})
            </button>
          </div>
        </div>

        {filteredModules.map((mod) => {
          const modExercises = filteredExercises.filter((ex) => {
            if (ex.track !== mod.track) return false;
            if (mod.id === 'diagnostico-docker') {
              return ex.track === 'docker' && ex.module === 'diagnostico';
            }
            return ex.module === mod.id;
          });

          if (modExercises.length === 0) return null;

          const modCompleted = modExercises.filter((ex) => getExerciseProgress(ex.id)?.completed).length;
          const percentage = Math.round((modCompleted / modExercises.length) * 100);

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
                  <span className="module-stat-text">{modCompleted}/{modExercises.length} ({percentage}%)</span>
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
                        <span className="level-badge">
                          {ex.track.toUpperCase()} • Nível {ex.level}
                        </span>
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
