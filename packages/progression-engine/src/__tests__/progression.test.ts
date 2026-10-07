import { describe, expect, it } from 'vitest';
import { MemoryStorageAdapter } from '../adapters/memory-adapter.js';
import {
  DEFAULT_PROFILE_ID,
  DEFAULT_PROFILE_NAME,
  ProgressionEngine,
} from '../engine.js';
import {
  mergeDatasets,
  mergeExerciseProgress,
  ProgressValidationError,
  validateImportPayload,
} from '../merge.js';
import { calculateProgressStats, getExerciseStatus } from '../metrics.js';
import type { ExerciseProgress, Profile, ProgressExportData } from '../types.js';

describe('ProgressionEngine & StorageAdapter', () => {
  it('cria automaticamente o perfil padrão "Estudante" no primeiro acesso', async () => {
    const adapter = new MemoryStorageAdapter();
    const engine = new ProgressionEngine(adapter);

    const activeProfile = await engine.init();
    expect(activeProfile).toBeDefined();
    expect(activeProfile.id).toBe(DEFAULT_PROFILE_ID);
    expect(activeProfile.name).toBe(DEFAULT_PROFILE_NAME);

    const profiles = await engine.getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0]!.name).toBe('Estudante');
  });

  it('permite criar novos perfis e alternar o perfil ativo', async () => {
    const adapter = new MemoryStorageAdapter();
    const engine = new ProgressionEngine(adapter);
    await engine.init();

    const newProfile = await engine.createProfile('Maria Silva');
    expect(newProfile.name).toBe('Maria Silva');
    expect(newProfile.id).toBeDefined();

    const profiles = await engine.getProfiles();
    expect(profiles).toHaveLength(2);

    // Troca de perfil ativo
    await engine.setActiveProfile(newProfile.id);
    const active = await engine.getActiveProfile();
    expect(active.id).toBe(newProfile.id);
    expect(active.name).toBe('Maria Silva');
  });

  it('impede exclusão do único perfil restante e trata exclusão do perfil ativo', async () => {
    const adapter = new MemoryStorageAdapter();
    const engine = new ProgressionEngine(adapter);
    await engine.init();

    // Tentar deletar o único perfil deve lançar erro
    await expect(engine.deleteProfile(DEFAULT_PROFILE_ID)).rejects.toThrow(
      'Não é possível excluir o único perfil existente.'
    );

    const p2 = await engine.createProfile('Segundo Perfil');
    await engine.setActiveProfile(p2.id);

    // Deletar p2 (que é o ativo) deve alternar para o restante
    await engine.deleteProfile(p2.id);
    const profiles = await engine.getProfiles();
    expect(profiles).toHaveLength(1);
    const currentActive = await engine.getActiveProfile();
    expect(currentActive.id).toBe(DEFAULT_PROFILE_ID);
  });

  it('registra tentativas isoladas por perfil e mantém histórico completo', async () => {
    const adapter = new MemoryStorageAdapter();
    const engine = new ProgressionEngine(adapter);
    await engine.init();

    // 1ª tentativa: errada
    const attempt1 = await engine.recordAttempt({
      exerciseId: 'sql-01',
      trackId: 'sql',
      moduleId: 'sql-intro',
      code: 'SELECT * FROM aluno;',
      status: 'error',
      isSuccess: false,
      executionTimeMs: 12,
    });

    expect(attempt1.completed).toBe(false);
    expect(attempt1.attemptsCount).toBe(1);
    expect(attempt1.successfulAttemptsCount).toBe(0);
    expect(attempt1.history).toHaveLength(1);
    expect(attempt1.firstCompletedAt).toBeNull();

    // 2ª tentativa: correta
    const attempt2 = await engine.recordAttempt({
      exerciseId: 'sql-01',
      trackId: 'sql',
      moduleId: 'sql-intro',
      code: 'SELECT * FROM alunos;',
      status: 'correct',
      isSuccess: true,
      executionTimeMs: 15,
      hintsViewed: 1,
    });

    expect(attempt2.completed).toBe(true);
    expect(attempt2.attemptsCount).toBe(2);
    expect(attempt2.successfulAttemptsCount).toBe(1);
    expect(attempt2.history).toHaveLength(2);
    expect(attempt2.firstCompletedAt).toBeTruthy();

    // 3ª tentativa: errada posterior NÃO deve desmarcar completed
    const attempt3 = await engine.recordAttempt({
      exerciseId: 'sql-01',
      trackId: 'sql',
      moduleId: 'sql-intro',
      code: 'SELECT algo_invalido;',
      status: 'error',
      isSuccess: false,
    });

    expect(attempt3.completed).toBe(true);
    expect(attempt3.attemptsCount).toBe(3);
    expect(attempt3.successfulAttemptsCount).toBe(1);
    expect(attempt3.firstCompletedAt).toBe(attempt2.firstCompletedAt);
  });

  it('isola progresso entre diferentes perfis', async () => {
    const adapter = new MemoryStorageAdapter();
    const engine = new ProgressionEngine(adapter);
    await engine.init();

    // Usuário 1 conclui sql-01
    await engine.recordAttempt({
      exerciseId: 'sql-01',
      trackId: 'sql',
      moduleId: 'sql-intro',
      code: 'SELECT 1;',
      status: 'correct',
      isSuccess: true,
    });

    // Cria e ativa Usuário 2
    const u2 = await engine.createProfile('Estudante 2');
    await engine.setActiveProfile(u2.id);

    // Usuário 2 não deve ter progresso em sql-01
    const progU2 = await engine.getProgress('sql-01');
    expect(progU2).toBeNull();

    // Usuário 1 ainda tem progresso concluído
    const progU1 = await engine.getProgress('sql-01', DEFAULT_PROFILE_ID);
    expect(progU1?.completed).toBe(true);
  });
});

describe('Métricas de Progresso (calculateProgressStats)', () => {
  const dummyExercises = [
    { id: 'sql-01', trackId: 'sql', moduleId: 'mod-1' },
    { id: 'sql-02', trackId: 'sql', moduleId: 'mod-1' },
    { id: 'sql-03', trackId: 'sql', moduleId: 'mod-2' },
    { id: 'sql-04', trackId: 'sql', moduleId: 'mod-2' },
  ];

  it('calcula métricas corretamente quando nada foi completado', () => {
    const stats = calculateProgressStats(dummyExercises, []);
    expect(stats.totalExercises).toBe(4);
    expect(stats.completedExercises).toBe(0);
    expect(stats.completionPercentage).toBe(0);
    expect(stats.totalAttempts).toBe(0);
    expect(stats.tracks['sql']?.totalExercises).toBe(4);
    expect(stats.tracks['sql']?.completedExercises).toBe(0);
    expect(stats.tracks['sql']?.modules['mod-1']?.totalExercises).toBe(2);
  });

  it('calcula percentuais e contagens agregadas com exercícios concluídos', () => {
    const progressList: ExerciseProgress[] = [
      {
        profileId: 'default',
        exerciseId: 'sql-01',
        trackId: 'sql',
        moduleId: 'mod-1',
        completed: true,
        firstCompletedAt: '2026-03-01T10:00:00Z',
        lastAttemptAt: '2026-03-01T10:00:00Z',
        attemptsCount: 3,
        successfulAttemptsCount: 1,
        lastCode: 'SELECT 1;',
        history: [],
      },
      {
        profileId: 'default',
        exerciseId: 'sql-02',
        trackId: 'sql',
        moduleId: 'mod-1',
        completed: true,
        firstCompletedAt: '2026-03-01T10:05:00Z',
        lastAttemptAt: '2026-03-01T10:05:00Z',
        attemptsCount: 2,
        successfulAttemptsCount: 1,
        lastCode: 'SELECT 2;',
        history: [],
      },
      {
        profileId: 'default',
        exerciseId: 'sql-03',
        trackId: 'sql',
        moduleId: 'mod-2',
        completed: false,
        firstCompletedAt: null,
        lastAttemptAt: '2026-03-01T10:10:00Z',
        attemptsCount: 5,
        successfulAttemptsCount: 0,
        lastCode: 'SELECT 3;',
        history: [],
      },
    ];

    const stats = calculateProgressStats(dummyExercises, progressList);
    // 2 de 4 concluídos = 50%
    expect(stats.totalExercises).toBe(4);
    expect(stats.completedExercises).toBe(2);
    expect(stats.completionPercentage).toBe(50);
    expect(stats.totalAttempts).toBe(10); // 3 + 2 + 5

    // mod-1: 2/2 concluídos = 100%
    const mod1 = stats.tracks['sql']?.modules['mod-1'];
    expect(mod1?.totalExercises).toBe(2);
    expect(mod1?.completedExercises).toBe(2);
    expect(mod1?.completionPercentage).toBe(100);
    expect(mod1?.totalAttempts).toBe(5);

    // mod-2: 0/2 concluídos = 0%
    const mod2 = stats.tracks['sql']?.modules['mod-2'];
    expect(mod2?.totalExercises).toBe(2);
    expect(mod2?.completedExercises).toBe(0);
    expect(mod2?.completionPercentage).toBe(0);
    expect(mod2?.totalAttempts).toBe(5);

    // getExerciseStatus helper
    const status01 = getExerciseStatus('sql-01', progressList);
    expect(status01.completed).toBe(true);
    expect(status01.attemptsCount).toBe(3);

    const status04 = getExerciseStatus('sql-04', progressList);
    expect(status04.completed).toBe(false);
    expect(status04.attemptsCount).toBe(0);
  });
});

describe('Export/Import & Smart Merge', () => {
  it('valida estritamente schema Zod de importação e rejeita payload inválido', () => {
    expect(() => validateImportPayload('invalid json')).toThrow(ProgressValidationError);
    expect(() => validateImportPayload({})).toThrow(ProgressValidationError);
    expect(() =>
      validateImportPayload({
        version: 2, // version inválida
        exportedAt: '2026-03-01',
        profiles: [],
        progress: [],
      })
    ).toThrow(ProgressValidationError);
  });

  it('mergeExerciseProgress preserva status completed e data mais antiga de conclusão', () => {
    const existing: ExerciseProgress = {
      profileId: 'p1',
      exerciseId: 'sql-01',
      trackId: 'sql',
      moduleId: 'mod-1',
      completed: true,
      firstCompletedAt: '2026-01-01T10:00:00.000Z',
      lastAttemptAt: '2026-01-01T10:00:00.000Z',
      attemptsCount: 1,
      successfulAttemptsCount: 1,
      lastCode: 'SELECT 1;',
      history: [
        {
          id: 'att-1',
          exerciseId: 'sql-01',
          trackId: 'sql',
          moduleId: 'mod-1',
          timestamp: '2026-01-01T10:00:00.000Z',
          code: 'SELECT 1;',
          status: 'correct',
          isSuccess: true,
        },
      ],
    };

    const imported: ExerciseProgress = {
      profileId: 'p1',
      exerciseId: 'sql-01',
      trackId: 'sql',
      moduleId: 'mod-1',
      completed: false, // Importado sem completed
      firstCompletedAt: null,
      lastAttemptAt: '2026-02-01T15:00:00.000Z',
      attemptsCount: 2,
      successfulAttemptsCount: 0,
      lastCode: 'SELECT 99;',
      history: [
        {
          id: 'att-2',
          exerciseId: 'sql-01',
          trackId: 'sql',
          moduleId: 'mod-1',
          timestamp: '2026-02-01T15:00:00.000Z',
          code: 'SELECT 99;',
          status: 'wrong',
          isSuccess: false,
        },
      ],
    };

    const merged = mergeExerciseProgress(existing, imported);

    // GARANTIA: completed preservado!
    expect(merged.completed).toBe(true);
    expect(merged.firstCompletedAt).toBe('2026-01-01T10:00:00.000Z');
    expect(merged.lastAttemptAt).toBe('2026-02-01T15:00:00.000Z');
    expect(merged.history).toHaveLength(2);
    expect(merged.history[0]?.id).toBe('att-1');
    expect(merged.history[1]?.id).toBe('att-2');
  });

  it('mergeDatasets une perfis e históricos sem duplicatas', () => {
    const currentProfile: Profile = {
      id: 'p1',
      name: 'Estudante A',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const importedProfile: Profile = {
      id: 'p2',
      name: 'Estudante B',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    };

    const importData: ProgressExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profiles: [importedProfile],
      progress: [
        {
          profileId: 'p2',
          exerciseId: 'sql-02',
          trackId: 'sql',
          moduleId: 'mod-1',
          completed: true,
          firstCompletedAt: '2026-02-01T10:00:00Z',
          lastAttemptAt: '2026-02-01T10:00:00Z',
          attemptsCount: 1,
          successfulAttemptsCount: 1,
          lastCode: 'SELECT 2;',
          history: [],
        },
      ],
    };

    const result = mergeDatasets(
      { profiles: [currentProfile], progress: [] },
      importData
    );

    expect(result.profiles).toHaveLength(2);
    expect(result.profiles.map((p) => p.name)).toEqual(['Estudante A', 'Estudante B']);
    expect(result.progress).toHaveLength(1);
    expect(result.progress[0]!.exerciseId).toBe('sql-02');
  });

  it('fluxo completo de export e import no ProgressionEngine', async () => {
    const adapter1 = new MemoryStorageAdapter();
    const engine1 = new ProgressionEngine(adapter1);
    await engine1.init();

    await engine1.recordAttempt({
      exerciseId: 'sql-01',
      trackId: 'sql',
      moduleId: 'sql-intro',
      code: 'SELECT * FROM alunos;',
      status: 'correct',
      isSuccess: true,
    });

    const exportedJson = await engine1.exportDataAsJson();
    expect(typeof exportedJson).toBe('string');

    // Importar em novo engine
    const adapter2 = new MemoryStorageAdapter();
    const engine2 = new ProgressionEngine(adapter2);
    await engine2.init();

    const importResult = await engine2.importDataFromJson(exportedJson);
    expect(importResult.profilesCount).toBeGreaterThanOrEqual(1);
    expect(importResult.progressCount).toBeGreaterThanOrEqual(1);

    const prog = await engine2.getProgress('sql-01', DEFAULT_PROFILE_ID);
    expect(prog).not.toBeNull();
    expect(prog?.completed).toBe(true);
    expect(prog?.lastCode).toBe('SELECT * FROM alunos;');
  });
});
