import React, { useRef, useState } from 'react';
import type { AppView } from '../types';
import { useProgression } from '../context/ProgressionContext';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenProfile: () => void;
  currentLessonLabel?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenProfile,
  currentLessonLabel = '1/8',
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { currentProfile, stats, exportData, importData } = useProgression();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const isDashboardActive = currentView === 'dashboard' || currentView === 'home';
  const isLessonActive = currentView === 'lesson' || currentView === 'exercise';
  const isTracksActive = currentView === 'tracks';
  const isReviewActive = currentView === 'review';
  const isRankingActive = currentView === 'ranking';

  const completedCount = stats?.completedExercises ?? 0;
  const totalCount = stats?.totalExercises ?? 19;
  const progressBadge = `${completedCount}/${totalCount}`;

  // Métricas dinâmicas do perfil ativo
  const streakDays = currentProfile?.streak?.currentStreak ?? 0;
  const userXp = currentProfile?.gamification?.xp ?? 0;

  const handleNav = (view: AppView) => {
    onNavigate(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleSaveJson = async () => {
    try {
      const json = await exportData(currentProfile?.id);
      const safeName = (currentProfile?.name || 'aluno')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-');
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vetor-perfil-${safeName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupMessage('JSON exportado com sucesso!');
      setTimeout(() => setBackupMessage(null), 3000);
    } catch (err: unknown) {
      setBackupMessage(err instanceof Error ? err.message : 'Falha ao exportar.');
      setTimeout(() => setBackupMessage(null), 3000);
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await importData(text);
      setBackupMessage(`Restaurado (${res.profilesCount} perfis, ${res.progressCount} ex)!`);
      setTimeout(() => setBackupMessage(null), 3500);
    } catch (err: unknown) {
      setBackupMessage(err instanceof Error ? err.message : 'Erro no JSON.');
      setTimeout(() => setBackupMessage(null), 3500);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {/* Overlay para mobile quando a barra lateral estiver aberta */}
      {isOpenMobile && (
        <div
          className="sidebar-mobile-overlay"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`vetor-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
        {/* Topo: Marca Vetor */}
        <div className="sidebar-brand-wrap" onClick={() => handleNav('dashboard')}>
          <div className="vetor-brand-badge">
            <span className="brand-v-char">V</span>
          </div>
          <div className="vetor-brand-text">
            <span className="brand-vetor-title">Vetor</span>
          </div>
        </div>

        {/* Navegação Vertical Global */}
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${isDashboardActive ? 'active' : ''}`}
            onClick={() => handleNav('dashboard')}
          >
            <span className="nav-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </span>
            <span className="nav-item-text">Painel</span>
          </button>

          <button
            className={`sidebar-nav-item ${isLessonActive ? 'active' : ''}`}
            onClick={() => handleNav('lesson')}
          >
            <span className="nav-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </span>
            <span className="nav-item-text">Aula atual</span>
            <span className="nav-item-badge">{currentLessonLabel || progressBadge}</span>
          </button>

          <button
            className={`sidebar-nav-item ${isTracksActive ? 'active' : ''}`}
            onClick={() => handleNav('tracks')}
          >
            <span className="nav-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </span>
            <span className="nav-item-text">Trilhas</span>
          </button>

          <button
            className={`sidebar-nav-item ${isReviewActive ? 'active' : ''}`}
            onClick={() => handleNav('review')}
          >
            <span className="nav-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </span>
            <span className="nav-item-text">Revisão</span>
            <span className="nav-item-pill">Repetição</span>
          </button>

          <button
            className={`sidebar-nav-item ${isRankingActive ? 'active' : ''}`}
            onClick={() => handleNav('ranking')}
          >
            <span className="nav-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
              </svg>
            </span>
            <span className="nav-item-text">Ranking</span>
            <span className="nav-item-badge xp-highlight">{userXp > 0 ? `${userXp} XP` : 'Top 10'}</span>
          </button>
        </nav>

        {/* Rodapé do Sidebar */}
        <div className="sidebar-footer">
          {/* Card com métrica de hábito dinâmico */}
          <div className="habit-metric-card" title={`Sequência atual: ${streakDays} dias consecutivos`}>
            <div className="habit-icon-wrap">
              <span className="habit-flame">🔥</span>
            </div>
            <div className="habit-info">
              <span className="habit-title">
                {streakDays} {streakDays === 1 ? 'dia' : 'dias'}
              </span>
              <span className="habit-subtitle">de sequência de estudo</span>
            </div>
            <div className="habit-progress-mini">
              <div
                className="habit-bar-fill"
                style={{ width: `${Math.min(100, Math.max(12, streakDays * 7))}%` }}
              />
            </div>
          </div>

          {/* Atalhos Rápidos de Backup em JSON */}
          <div className="sidebar-backup-actions">
            <button
              type="button"
              className="sidebar-action-btn"
              onClick={handleSaveJson}
              title="Salvar Perfil em JSON"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Salvar Perfil em JSON</span>
            </button>

            <button
              type="button"
              className="sidebar-action-btn secondary"
              onClick={() => fileInputRef.current?.click()}
              title="Importar Perfil JSON"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Importar Perfil JSON</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportJson}
            />
          </div>

          {backupMessage && (
            <div className="sidebar-toast-msg">{backupMessage}</div>
          )}

          {/* Usuário / Perfil e Backup Modal */}
          <button
            className="sidebar-user-btn"
            onClick={onOpenProfile}
            title="Gerenciar perfil e alternar usuários"
          >
            <div className="sidebar-avatar">
              <span>{currentProfile?.name?.[0]?.toUpperCase() ?? 'E'}</span>
            </div>
            <div className="sidebar-user-meta">
              <span className="sidebar-user-name">{currentProfile?.name ?? 'Estudante'}</span>
              <span className="sidebar-user-role">{userXp} XP · Ativo</span>
            </div>
            <span className="sidebar-user-settings-icon">⚙️</span>
          </button>
        </div>
      </aside>
    </>
  );
};
