import React, { useState } from 'react';
import type { AppView } from '../types';
import { useSqlEngine } from '../context/SqlEngineContext';
import { useProgression } from '../context/ProgressionContext';
import { ProfileModal } from './ProfileModal';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { status, statusMessage } = useSqlEngine();
  const { currentProfile, stats } = useProgression();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <>
      <header className="app-header">
        <div className="brand" onClick={() => onNavigate('home')}>
          <span className="brand-icon">🐘🐧</span>
          <span>SQL &amp; Linux Lab</span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${currentView === 'home' || currentView === 'exercise' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            Trilhas &amp; Exercícios
          </button>
          <button
            className={`nav-btn ${currentView === 'reference' ? 'active' : ''}`}
            onClick={() => onNavigate('reference')}
          >
            Material de Consulta
          </button>
        </nav>

        <div className="header-right">
          {stats && (
            <div
              className="stats-badge"
              title={`Progresso geral: ${stats.completedExercises} de ${stats.totalExercises} exercícios concluídos`}
            >
              <span className="stats-icon">🎯</span>
              <span>
                {stats.completedExercises}/{stats.totalExercises} ({stats.completionPercentage}%)
              </span>
            </div>
          )}

          <button
            className="profile-btn"
            onClick={() => setIsProfileModalOpen(true)}
            title="Gerenciar perfis e backup de progresso"
          >
            <span className="profile-icon">👤</span>
            <span className="profile-name-text">{currentProfile?.name ?? 'Estudante'}</span>
            <span className="profile-caret">▾</span>
          </button>

          <div className={`status-badge ${status}`} title={statusMessage}>
            <span className="status-dot" />
            <span>{statusMessage}</span>
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

