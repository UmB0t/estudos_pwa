import React, { useState } from 'react';
import type { AppView } from '../types';
import { useProgression } from '../context/ProgressionContext';
import { ProfileModal } from './ProfileModal';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView, sectionId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { currentProfile, stats } = useProgression();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleNavClick = (view: AppView, sectionId?: string) => {
    onNavigate(view, sectionId);
    if (sectionId && (currentView === 'home' || view === 'home')) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <div className="brand" onClick={() => handleNavClick('home')}>
            <div className="brand-logo-badge">
              <span className="brand-letter">V</span>
            </div>
            <div className="brand-text">
              <div className="brand-name">Vetor</div>
            </div>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-btn ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              Painel
            </button>
            <button
              className="nav-btn"
              onClick={() => handleNavClick('home', 'section-trilhas')}
            >
              Trilhas
            </button>
            <button
              className="nav-btn"
              onClick={() => handleNavClick('home', 'section-exercicios')}
            >
              Laboratórios
            </button>
            <button
              className={`nav-btn ${currentView === 'reference' ? 'active' : ''}`}
              onClick={() => handleNavClick('reference')}
            >
              Material de Consulta
            </button>
          </nav>
        </div>

        <div className="header-right">
          {stats && (
            <div
              className="streak-badge"
              title={`Você dominou ${stats.completedExercises} de ${stats.totalExercises} exercícios (${stats.completionPercentage}%)`}
            >
              <span className="streak-icon">⚡</span>
              <span className="streak-count">{stats.completedExercises}/{stats.totalExercises}</span>
              <span className="streak-label">Dominados</span>
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
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
