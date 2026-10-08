import React, { useState, useMemo } from 'react';
import { SqlEngineProvider } from './context/SqlEngineContext';
import { ProgressionProvider, useProgression } from './context/ProgressionContext';
import { Sidebar } from './components/Sidebar';
import { ProfileModal } from './components/ProfileModal';
import { DashboardPage } from './pages/DashboardPage';
import { GuidedLessonPage } from './pages/GuidedLessonPage';
import { TracksPage } from './pages/TracksPage';
import { ReviewPage } from './pages/ReviewPage';
import { RankingPage } from './pages/RankingPage';
import { ReferencePage } from './pages/ReferencePage';
import {
  TRACKS_CATALOG,
  getTrackByExerciseId,
  type TrackDefinition,
} from './content/guidedContent';
import type { AppView } from './types';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('sql-01-select-todos-alunos');
  const [selectedTrackCode, setSelectedTrackCode] = useState<string>('DB-201');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { getExerciseProgress, currentProfile } = useProgression();

  // Seleciona lição e redireciona para a visão de aula guiada
  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    const track = getTrackByExerciseId(lessonId);
    if (track) {
      setSelectedTrackCode(track.code);
    }
    setCurrentView('lesson');
  };

  // Abre uma trilha na visão de trilhas
  const handleOpenTrack = (trackCode: string) => {
    setSelectedTrackCode(trackCode);
    setCurrentView('tracks');
  };

  // Computa o label da aula em andamento para o sidebar (ex: 7/11)
  const currentTrack: TrackDefinition = useMemo(() => {
    return TRACKS_CATALOG.find((t) => t.code === selectedTrackCode) ?? TRACKS_CATALOG[0]!;
  }, [selectedTrackCode]);

  const currentLessonLabel = useMemo(() => {
    if (!currentTrack) return '0/0';
    const completed = currentTrack.lessons.filter((l) => {
      const p = getExerciseProgress(l.exerciseId || l.id);
      return p?.completed;
    }).length;
    return `${completed}/${currentTrack.lessons.length}`;
  }, [currentTrack, getExerciseProgress]);

  const mobileStreak = currentProfile?.streak?.currentStreak ?? 0;

  return (
    <div className="vetor-app-container">
      {/* Barra de Topo exclusiva para Mobile */}
      <div className="mobile-top-bar">
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Abrir menu de navegação"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <div className="mobile-brand" onClick={() => setCurrentView('dashboard')}>
          <div className="vetor-brand-badge mini">
            <span className="brand-v-char">V</span>
          </div>
          <span className="brand-vetor-title">Vetor</span>
        </div>

        <div className="mobile-streak-pill" title={`Sequência de estudo: ${mobileStreak} dias`}>
          <span>🔥 {mobileStreak}d</span>
        </div>
      </div>

      {/* Barra Lateral Fixa (Global) */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        currentLessonLabel={currentLessonLabel}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Área Central / Conteúdo Principal */}
      <main className="app-main-viewport">
        {(currentView === 'dashboard' || currentView === 'home') && (
          <DashboardPage
            onSelectLesson={handleSelectLesson}
            onOpenTrack={handleOpenTrack}
          />
        )}

        {(currentView === 'lesson' || currentView === 'exercise') && (
          <GuidedLessonPage
            lessonId={selectedLessonId}
            onSelectLesson={handleSelectLesson}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onNavigateToTracks={() => setCurrentView('tracks')}
          />
        )}

        {currentView === 'tracks' && (
          <TracksPage
            onSelectLesson={handleSelectLesson}
            onBackToDashboard={() => setCurrentView('dashboard')}
            initialTrackCode={selectedTrackCode}
          />
        )}

        {currentView === 'review' && (
          <ReviewPage
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'ranking' && (
          <RankingPage
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'reference' && <ReferencePage />}
      </main>

      {/* Modal de Gerenciamento de Perfil e Backup */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ProgressionProvider>
      <SqlEngineProvider>
        <AppContent />
      </SqlEngineProvider>
    </ProgressionProvider>
  );
};
