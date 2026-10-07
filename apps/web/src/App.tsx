import React, { useState } from 'react';
import { SqlEngineProvider } from './context/SqlEngineContext';
import { ProgressionProvider } from './context/ProgressionContext';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { ExercisePage } from './pages/ExercisePage';
import { ReferencePage } from './pages/ReferencePage';
import { getAllExercises, getExerciseById } from './content';
import type { AppView } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  const allExercises = getAllExercises();

  const handleSelectExercise = (id: string) => {
    setSelectedExerciseId(id);
    setCurrentView('exercise');
  };

  const currentExercise = selectedExerciseId ? getExerciseById(selectedExerciseId) : null;
  const currentIndex = allExercises.findIndex((ex) => ex.id === selectedExerciseId);
  const nextExercise = currentIndex >= 0 && currentIndex < allExercises.length - 1 ? allExercises[currentIndex + 1] : null;

  const handleNext = () => {
    if (nextExercise) {
      setSelectedExerciseId(nextExercise.id);
    }
  };

  const handleNavigate = (view: AppView, sectionId?: string) => {
    setCurrentView(view);
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  return (
    <ProgressionProvider>
      <SqlEngineProvider>
        <div className="app-layout">
          <Header currentView={currentView} onNavigate={handleNavigate} />

          <main>
            {currentView === 'home' && (
              <HomePage
                onSelectExercise={handleSelectExercise}
              />
            )}

            {currentView === 'exercise' && currentExercise && (
              <ExercisePage
                exercise={currentExercise}
                onBack={() => setCurrentView('home')}
                onNext={handleNext}
                hasNext={Boolean(nextExercise)}
              />
            )}

            {currentView === 'reference' && <ReferencePage />}
          </main>
        </div>
      </SqlEngineProvider>
    </ProgressionProvider>
  );
};
