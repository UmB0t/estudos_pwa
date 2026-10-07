import React from 'react';
import type { AppView } from '../types';
import { useSqlEngine } from '../context/SqlEngineContext';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { status, statusMessage } = useSqlEngine();

  return (
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
        <div className={`status-badge ${status}`} title={statusMessage}>
          <span className="status-dot" />
          <span>{statusMessage}</span>
        </div>
      </div>
    </header>
  );
};
