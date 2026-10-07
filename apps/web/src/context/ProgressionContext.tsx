import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  type ExerciseProgress,
  type OverallStats,
  type Profile,
  type RecordAttemptParams,
  ProgressionEngine,
  createAutoStorageAdapter,
} from '@lab/progression-engine';
import { getAllExercises } from '../content';

interface ProgressionContextValue {
  currentProfile: Profile | null;
  profiles: Profile[];
  activeProgress: ExerciseProgress[];
  stats: OverallStats | null;
  isLoaded: boolean;
  switchProfile: (profileId: string) => Promise<void>;
  createProfile: (name: string) => Promise<Profile>;
  deleteProfile: (profileId: string) => Promise<void>;
  recordAttempt: (params: Omit<RecordAttemptParams, 'profileId'>) => Promise<ExerciseProgress>;
  getExerciseProgress: (exerciseId: string) => ExerciseProgress | null;
  exportData: (profileId?: string) => Promise<string>;
  importData: (jsonString: string) => Promise<{ profilesCount: number; progressCount: number }>;
  refresh: () => Promise<void>;
}

const ProgressionContext = createContext<ProgressionContextValue | null>(null);

export const ProgressionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engine, setEngine] = useState<ProgressionEngine | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProgress, setActiveProgress] = useState<ExerciseProgress[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const allExercises = useMemo(() => {
    return getAllExercises().map((ex) => ({
      id: ex.id,
      trackId: ex.track,
      moduleId: ex.module,
    }));
  }, []);

  // Initialize engine and storage adapter
  useEffect(() => {
    let isMounted = true;

    async function setupEngine() {
      try {
        const adapter = await createAutoStorageAdapter();
        const eng = new ProgressionEngine(adapter);
        const active = await eng.init();

        if (isMounted) {
          setEngine(eng);
          setCurrentProfile(active);
          const profList = await eng.getProfiles();
          setProfiles(profList);
          const prog = await eng.getAllProgress(active.id);
          setActiveProgress(prog);
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('[ProgressionProvider] Erro ao inicializar ProgressionEngine:', err);
      }
    }

    setupEngine();

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!engine || !currentProfile) return;
    const profList = await engine.getProfiles();
    setProfiles(profList);
    const active = await engine.getActiveProfile();
    setCurrentProfile(active);
    const prog = await engine.getAllProgress(active.id);
    setActiveProgress(prog);
  }, [engine, currentProfile]);

  const switchProfile = useCallback(
    async (profileId: string) => {
      if (!engine) return;
      await engine.setActiveProfile(profileId);
      const active = await engine.getActiveProfile();
      setCurrentProfile(active);
      const prog = await engine.getAllProgress(active.id);
      setActiveProgress(prog);
    },
    [engine]
  );

  const createProfile = useCallback(
    async (name: string): Promise<Profile> => {
      if (!engine) throw new Error('Engine não inicializado');
      const newProf = await engine.createProfile(name);
      await engine.setActiveProfile(newProf.id);
      setCurrentProfile(newProf);
      const profList = await engine.getProfiles();
      setProfiles(profList);
      const prog = await engine.getAllProgress(newProf.id);
      setActiveProgress(prog);
      return newProf;
    },
    [engine]
  );

  const deleteProfile = useCallback(
    async (profileId: string) => {
      if (!engine) return;
      await engine.deleteProfile(profileId);
      const profList = await engine.getProfiles();
      setProfiles(profList);
      const active = await engine.getActiveProfile();
      setCurrentProfile(active);
      const prog = await engine.getAllProgress(active.id);
      setActiveProgress(prog);
    },
    [engine]
  );

  const recordAttempt = useCallback(
    async (params: Omit<RecordAttemptParams, 'profileId'>): Promise<ExerciseProgress> => {
      if (!engine || !currentProfile) throw new Error('Engine não inicializado');
      const updated = await engine.recordAttempt({
        ...params,
        profileId: currentProfile.id,
      });
      const prog = await engine.getAllProgress(currentProfile.id);
      setActiveProgress(prog);
      return updated;
    },
    [engine, currentProfile]
  );

  const getExerciseProgress = useCallback(
    (exerciseId: string): ExerciseProgress | null => {
      return activeProgress.find((p) => p.exerciseId === exerciseId) || null;
    },
    [activeProgress]
  );

  const exportData = useCallback(
    async (profileId?: string): Promise<string> => {
      if (!engine) throw new Error('Engine não inicializado');
      return engine.exportDataAsJson(profileId);
    },
    [engine]
  );

  const importData = useCallback(
    async (jsonString: string): Promise<{ profilesCount: number; progressCount: number }> => {
      if (!engine) throw new Error('Engine não inicializado');
      const res = await engine.importDataFromJson(jsonString);
      await refresh();
      return res;
    },
    [engine, refresh]
  );

  const stats = useMemo(() => {
    if (!engine) return null;
    return engine.getStats(allExercises, currentProfile?.id);
  }, [engine, allExercises, currentProfile, activeProgress]);

  // Synchronous resolution of stats
  const [resolvedStats, setResolvedStats] = useState<OverallStats | null>(null);
  useEffect(() => {
    let isCancelled = false;
    if (stats) {
      stats.then((s) => {
        if (!isCancelled) setResolvedStats(s);
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [stats]);

  const value = useMemo(
    () => ({
      currentProfile,
      profiles,
      activeProgress,
      stats: resolvedStats,
      isLoaded,
      switchProfile,
      createProfile,
      deleteProfile,
      recordAttempt,
      getExerciseProgress,
      exportData,
      importData,
      refresh,
    }),
    [
      currentProfile,
      profiles,
      activeProgress,
      resolvedStats,
      isLoaded,
      switchProfile,
      createProfile,
      deleteProfile,
      recordAttempt,
      getExerciseProgress,
      exportData,
      importData,
      refresh,
    ]
  );

  return <ProgressionContext.Provider value={value}>{children}</ProgressionContext.Provider>;
};

export function useProgression(): ProgressionContextValue {
  const ctx = useContext(ProgressionContext);
  if (!ctx) {
    throw new Error('useProgression deve ser utilizado dentro de ProgressionProvider');
  }
  return ctx;
}
