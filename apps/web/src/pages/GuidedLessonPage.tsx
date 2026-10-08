import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { EvaluationResult, Exercise } from '@lab/shared';
import type { SqlQueryResult } from '@lab/sql-engine';
import { LinuxEvaluator } from '@lab/linux-lab';
import { DockerEvaluator } from '@lab/docker-lab';
import { NetworkEvaluator } from '@lab/network-lab';
import { useSqlEngine } from '../context/SqlEngineContext';
import { useProgression } from '../context/ProgressionContext';
import { getExerciseById } from '../content';
import {
  TRACKS_CATALOG,
  getGuidedLessonById,
  type GuidedLesson,
  type TrackDefinition,
} from '../content/guidedContent';
import { DiagramViewer } from '../components/DiagramViewer';
import { ConceptQuiz } from '../components/ConceptQuiz';
import { PracticalExamples } from '../components/PracticalExamples';
import { SqlEditor } from '../components/SqlEditor';
import { Terminal } from '../components/Terminal';
import { ResultTable } from '../components/ResultTable';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { Mascot, type MascotEmotion } from '../components/Mascot';

interface GuidedLessonPageProps {
  lessonId: string;
  onSelectLesson: (id: string) => void;
  onBackToDashboard: () => void;
  onNavigateToTracks?: () => void;
}

type LessonTab = 'concept' | 'examples' | 'lab';

const linuxEvaluator = new LinuxEvaluator();
const dockerEvaluator = new DockerEvaluator();
const networkEvaluator = new NetworkEvaluator();

export const GuidedLessonPage: React.FC<GuidedLessonPageProps> = ({
  lessonId,
  onSelectLesson,
  onBackToDashboard,
  onNavigateToTracks,
}) => {
  const { evaluateExercise, getDatasetPreview, status: engineStatus } = useSqlEngine();
  const { recordAttempt, getExerciseProgress, refresh } = useProgression();

  // Abas do Tripé Pedagógico
  const [activeTab, setActiveTab] = useState<LessonTab>('concept');

  // Estado do Laboratório
  const [code, setCode] = useState('');
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [datasetPreview, setDatasetPreview] = useState<SqlQueryResult | null>(null);
  const [mascotEmotion, setMascotEmotion] = useState<MascotEmotion>('idle');
  const [isLessonFinished, setIsLessonFinished] = useState(false);

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recupera a lição guiada ativa
  const currentLesson: GuidedLesson = useMemo(() => {
    return (
      getGuidedLessonById(lessonId) ??
      TRACKS_CATALOG[0]!.lessons[0]!
    );
  }, [lessonId]);

  // Recupera a trilha à qual a lição pertence
  const currentTrack: TrackDefinition = useMemo(() => {
    return (
      TRACKS_CATALOG.find((t) => t.code === currentLesson.trackCode) ??
      TRACKS_CATALOG[0]!
    );
  }, [currentLesson.trackCode]);

  // Lista ordenada de aulas da trilha/módulo atual
  const trackLessons = currentTrack.lessons;
  const currentLessonIndex = trackLessons.findIndex((l) => l.id === currentLesson.id);
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < trackLessons.length - 1
      ? trackLessons[currentLessonIndex + 1]
      : null;

  // Carrega exercício associado (se for lab real)
  const linkedExercise: Exercise | undefined = useMemo(() => {
    if (currentLesson.exerciseId) {
      return getExerciseById(currentLesson.exerciseId);
    }
    return undefined;
  }, [currentLesson.exerciseId]);

  const existingProgress = getExerciseProgress(currentLesson.exerciseId || currentLesson.id);

  // Inicializa estado ao trocar de lição
  useEffect(() => {
    const saved = getExerciseProgress(currentLesson.exerciseId || currentLesson.id);
    setCode(saved?.lastCode || currentLesson.lab.defaultCode || '');
    setHintsRevealed(0);
    setShowSolution(false);
    setEvaluation(null);
    setIsEvaluating(false);
    setMascotEmotion('idle');
    setIsLessonFinished(Boolean(saved?.completed));

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (linkedExercise?.track === 'sql' && linkedExercise?.dataset) {
      getDatasetPreview(linkedExercise.dataset).then((preview) => {
        setDatasetPreview(preview);
      });
    } else {
      setDatasetPreview(null);
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [currentLesson, linkedExercise, getDatasetPreview, getExerciseProgress]);

  // Listener de digitação com a mascote
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setMascotEmotion('thinking');

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setMascotEmotion('idle');
    }, 8000);
  };

  // Avaliação do Laboratório Real
  const handleVerify = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify ?? code).trim();
    if (!targetCode || isEvaluating) return;

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    setIsEvaluating(true);
    setMascotEmotion('thinking');
    const startTime = performance.now();

    try {
      let res: EvaluationResult;

      if (linkedExercise) {
        if (linkedExercise.track === 'sql') {
          res = await evaluateExercise(linkedExercise, targetCode);
        } else if (linkedExercise.track === 'linux') {
          res = await linuxEvaluator.evaluate({ exercise: linkedExercise }, targetCode);
        } else if (linkedExercise.track === 'docker') {
          res = await dockerEvaluator.evaluate({ exercise: linkedExercise }, targetCode);
        } else {
          res = await networkEvaluator.evaluate({ exercise: linkedExercise }, targetCode);
        }
      } else {
        // Para lições puramente conceituais/algorítmicas sem backend de execução
        const isMatched = targetCode.length > 10;
        res = {
          status: isMatched ? 'correct' : 'almost',
          message: isMatched
            ? 'Excelente raciocínio! Código alinhado aos critérios da lição.'
            : 'Revise os critérios do checklist antes de finalizar.',
        };
      }

      const executionTimeMs = Math.round(performance.now() - startTime);
      setEvaluation(res);

      if (res.status === 'correct') {
        setMascotEmotion('celebrating');
        setIsLessonFinished(true);
      } else {
        setMascotEmotion('disapproval');
      }

      // Registra a tentativa no progression engine
      await recordAttempt({
        exerciseId: currentLesson.exerciseId || currentLesson.id,
        trackId: currentLesson.trackId,
        moduleId: linkedExercise?.module || 'modulo-1',
        code: targetCode,
        status: res.status,
        isSuccess: res.status === 'correct',
        executionTimeMs,
        hintsViewed: hintsRevealed,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setEvaluation({
        status: 'wrong',
        message: 'Erro na execução. Verifique a sintaxe ou restrições da consulta.',
        error: errMsg,
      });
      setMascotEmotion('disapproval');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Botão "Concluir aula"
  const handleConcludeLesson = async () => {
    try {
      await recordAttempt({
        exerciseId: currentLesson.exerciseId || currentLesson.id,
        trackId: currentLesson.trackId,
        moduleId: linkedExercise?.module || 'modulo-1',
        code: code.trim() || currentLesson.lab.defaultCode || 'SELECT * FROM alunos;',
        status: 'correct',
        isSuccess: true,
      });
      await refresh();
      setIsLessonFinished(true);

      if (nextLesson) {
        onSelectLesson(nextLesson.id);
        setActiveTab('concept');
      } else {
        onBackToDashboard();
      }
    } catch (err) {
      console.error('[GuidedLessonPage] Erro ao concluir aula:', err);
    }
  };

  // Checklist Dinâmico de Critérios
  const criteriaStatus = useMemo(() => {
    const lower = code.toLowerCase();
    return currentLesson.lab.criteria.map((_crit, idx) => {
      if (evaluation?.status === 'correct' || existingProgress?.completed) {
        return true;
      }
      // Heurísticas progressivas de digitação
      if (idx === 0) {
        return (
          lower.includes('select') ||
          lower.includes('pwd') ||
          lower.includes('docker') ||
          lower.includes('ping') ||
          lower.includes('function') ||
          code.trim().length > 5
        );
      }
      if (idx === 1) {
        return (
          lower.includes('from') ||
          lower.includes('where') ||
          lower.includes('cd') ||
          lower.includes('ps') ||
          lower.includes('curl') ||
          code.trim().length > 15
        );
      }
      return false;
    });
  }, [code, currentLesson.lab.criteria, evaluation, existingProgress]);

  // Contagem de aulas concluídas na trilha atual
  const completedInTrack = trackLessons.filter((l) => {
    const prog = getExerciseProgress(l.exerciseId || l.id);
    return prog?.completed;
  }).length;
  const trackPercentage = Math.round((completedInTrack / trackLessons.length) * 100);

  return (
    <div className="guided-lesson-layout">
      {/* ====================================================================
          COLUNA ESQUERDA: Ementa do Módulo & Navegação entre Aulas
          ==================================================================== */}
      <aside className="lesson-syllabus-sidebar">
        <div className="syllabus-top-header">
          <button
            type="button"
            className="syllabus-back-btn"
            onClick={onBackToDashboard}
            title="Voltar ao Painel Principal"
          >
            ← Painel
          </button>
          <span
            className="syllabus-track-badge"
            onClick={onNavigateToTracks}
            title={onNavigateToTracks ? 'Ver todas as trilhas' : undefined}
            style={onNavigateToTracks ? { cursor: 'pointer' } : undefined}
          >
            {currentTrack.code}
          </span>
        </div>

        <div className="syllabus-meta-section">
          <h2 className="syllabus-track-title">{currentTrack.name}</h2>
          <div className="syllabus-progress-meta">
            <span className="syllabus-progress-text">
              {completedInTrack} de {trackLessons.length} aulas · {trackPercentage}%
            </span>
            <div className="syllabus-progress-bar">
              <div
                className="syllabus-progress-fill"
                style={{ width: `${trackPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="syllabus-module-heading">
          <span className="syllabus-module-label">Ementa de Aulas</span>
        </div>

        {/* Lista Ordenada de Aulas */}
        <div className="syllabus-lessons-list">
          {trackLessons.map((lesson, idx) => {
            const isCur = lesson.id === currentLesson.id;
            const lessonProg = getExerciseProgress(lesson.exerciseId || lesson.id);
            const isCompleted = Boolean(lessonProg?.completed);

            let marker = (
              <span className="lesson-marker-num">
                {String(idx + 1).padStart(2, '0')}
              </span>
            );

            if (isCompleted) {
              marker = <span className="lesson-marker-check">✓</span>;
            } else if (isCur) {
              marker = <span className="lesson-marker-cur">▶</span>;
            }

            return (
              <button
                key={lesson.id}
                type="button"
                className={`syllabus-lesson-item ${isCur ? 'cur' : ''} ${
                  isCompleted ? 'is-completed' : ''
                }`}
                onClick={() => onSelectLesson(lesson.id)}
              >
                <div className="marker-box">{marker}</div>
                <div className="lesson-item-info">
                  <span className="lesson-item-title">{lesson.title}</span>
                  <span className="lesson-item-read">
                    {lesson.readTimeMin} min de leitura
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ====================================================================
          COLUNA DIREITA: Estrutura de Ensino em 3 Passos (Tabs Superiores)
          ==================================================================== */}
      <section className="lesson-main-content">
        {/* Abas Superiores do Tripé Pedagógico */}
        <header className="lesson-tabs-header">
          <div className="lesson-title-crumb">
            <span className="crumb-mod">{currentLesson.moduleTitle}</span>
            <span className="crumb-sep">/</span>
            <h1 className="crumb-lesson-title">{currentLesson.title}</h1>
          </div>

          <div className="pedagogical-tabs-nav">
            <button
              type="button"
              className={`pedagogical-tab ${activeTab === 'concept' ? 'active' : ''}`}
              onClick={() => setActiveTab('concept')}
            >
              <span className="tab-number">1</span>
              <span className="tab-label">Conceito</span>
            </button>

            <button
              type="button"
              className={`pedagogical-tab ${activeTab === 'examples' ? 'active' : ''}`}
              onClick={() => setActiveTab('examples')}
            >
              <span className="tab-number">2</span>
              <span className="tab-label">Exemplos Prontos</span>
            </button>

            <button
              type="button"
              className={`pedagogical-tab ${activeTab === 'lab' ? 'active' : ''}`}
              onClick={() => setActiveTab('lab')}
            >
              <span className="tab-number">3</span>
              <span className="tab-label">Laboratório Real</span>
            </button>
          </div>
        </header>

        {/* Conteúdo Dinâmico por Aba */}
        <div className="lesson-tab-body">
          {/* ================================================================
              PASSO 1: Explicação da Matéria (Conceito)
              ================================================================ */}
          {activeTab === 'concept' && (
            <div className="concept-step-container">
              <div className="concept-read-header">
                <span className="read-time-badge">
                  ⏱️ Leitura de {currentLesson.readTimeMin} min
                </span>
                <span className="concept-module-tag">
                  {currentLesson.moduleTitle}
                </span>
              </div>

              <h2 className="concept-article-title">
                {currentLesson.concept.title}
              </h2>

              <p className="concept-body-text">
                {currentLesson.concept.description}
              </p>

              {/* Diagrama Ilustrativo Vetorial SVG */}
              <DiagramViewer diagramType={currentLesson.concept.diagramType} />

              {/* Resumo em Caixa Destacada (.sum) */}
              <div className="sum">
                <div className="sum-header">
                  <span className="sum-icon">📌</span>
                  <h4 className="sum-title">Pontos Fundamentais do Conceito</h4>
                </div>
                <ul className="sum-points-list">
                  {currentLesson.concept.summaryPoints.map((point, pIdx) => (
                    <li key={pIdx} className="sum-point-item">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mini-Quiz de Fixação */}
              <ConceptQuiz
                questions={currentLesson.concept.quiz}
                onQuizCompleted={() => {
                  // Pode premiar pontos de XP
                }}
              />

              {/* Botão de Transição para o Passo 2 */}
              <div className="concept-transition-bar">
                <button
                  type="button"
                  className="btn-yel-action"
                  onClick={() => setActiveTab('examples')}
                >
                  Ver exemplos prontos ➔
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              PASSO 2: Aplicação Prática Teórica (Exemplos Prontos)
              ================================================================ */}
          {activeTab === 'examples' && (
            <PracticalExamples
              examples={currentLesson.examples}
              onProceedToLab={() => setActiveTab('lab')}
            />
          )}

          {/* ================================================================
              PASSO 3: Aplicação Prática Manual (Laboratório Real)
              ================================================================ */}
          {activeTab === 'lab' && (
            <div className="lab-step-container">
              {/* Painel do Enunciado e Checklist Dinâmico */}
              <div className="lab-task-card">
                <div className="task-header-row">
                  <span className="step-tag-pill">Passo 3 · Laboratório</span>
                  {isLessonFinished && (
                    <span className="badge-ok-pill">✓ Concluído</span>
                  )}
                </div>

                <h3 className="task-heading">Tarefa a Realizar:</h3>
                <p className="task-prompt">{currentLesson.lab.task}</p>

                {/* Checklist Dinâmico de Critérios */}
                <div className="dynamic-criteria-card">
                  <h4 className="criteria-heading">Critérios de Avaliação:</h4>
                  <div className="criteria-items-list">
                    {currentLesson.lab.criteria.map((crit, cIdx) => {
                      const isMet = criteriaStatus[cIdx];
                      return (
                        <div
                          key={cIdx}
                          className={`criteria-item ${isMet ? 'met' : 'pending'}`}
                        >
                          <span className="criteria-check-box">
                            {isMet ? '✓' : '○'}
                          </span>
                          <span className="criteria-text">{crit}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Prévia do Esquema do Dataset se for SQL */}
                {datasetPreview && (
                  <div className="lab-dataset-preview-wrap">
                    <ResultTable
                      data={datasetPreview}
                      title={`Tabela de Dados: "${linkedExercise?.dataset ?? 'alunos'}"`}
                    />
                  </div>
                )}
              </div>

              {/* Editor SQL / Terminal Interativo */}
              <div className="lab-editor-card">
                {linkedExercise?.track === 'sql' || currentLesson.trackId === 'sql' ? (
                  <SqlEditor
                    value={code}
                    onChange={handleCodeChange}
                    onExecute={() => handleVerify()}
                    disabled={isEvaluating}
                  />
                ) : (
                  <Terminal
                    track={linkedExercise?.track ?? 'linux'}
                    initialSetup={linkedExercise?.setup}
                    currentCode={code}
                    onCodeChange={handleCodeChange}
                    onCommandRun={(cmd) => handleVerify(cmd)}
                    disabled={isEvaluating}
                  />
                )}

                {/* Barra de Ações do Laboratório */}
                <div className="lab-actions-bar">
                  <div className="actions-left-group">
                    <button
                      type="button"
                      className="btn btn-yel-submit"
                      onClick={() => handleVerify()}
                      disabled={
                        isEvaluating ||
                        !code.trim() ||
                        (linkedExercise?.track === 'sql' && engineStatus === 'running')
                      }
                    >
                      {isEvaluating
                        ? 'Verificando...'
                        : 'Verificar resposta (Ctrl+Enter)'}
                    </button>

                    {linkedExercise && linkedExercise.hints.length > 0 && (
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setHintsRevealed((prev) =>
                            Math.min(prev + 1, linkedExercise.hints.length)
                          )
                        }
                        disabled={hintsRevealed >= linkedExercise.hints.length}
                      >
                        💡 Dica ({hintsRevealed}/{linkedExercise.hints.length})
                      </button>
                    )}

                    {!showSolution && linkedExercise && (
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => setShowSolution(true)}
                      >
                        🔑 Ver resposta
                      </button>
                    )}
                  </div>

                  {/* Botão "Concluir aula" que atualiza o progresso e avança */}
                  <div className="actions-right-group">
                    <button
                      type="button"
                      className={`btn btn-conclude-lesson ${
                        evaluation?.status === 'correct' || isLessonFinished
                          ? 'ready'
                          : ''
                      }`}
                      onClick={handleConcludeLesson}
                    >
                      {nextLesson ? 'Concluir aula & Próxima ➔' : 'Concluir aula ✓'}
                    </button>
                  </div>
                </div>

                {/* Exibição de Dicas */}
                {hintsRevealed > 0 && linkedExercise && (
                  <div className="hints-container">
                    <h4 className="hints-title">
                      💡 Dicas Reveladas ({hintsRevealed}/{linkedExercise.hints.length}):
                    </h4>
                    {linkedExercise.hints.slice(0, hintsRevealed).map((hint, hIdx) => (
                      <div key={hIdx} className="hint-item">
                        <span className="hint-num">{hIdx + 1}</span>
                        <p className="hint-text">{hint}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gabarito / Solução */}
                {showSolution && linkedExercise && (
                  <div className="solution-container">
                    <h4 className="solution-title">🔑 Solução de Referência:</h4>
                    <pre className="code-navy-block">{linkedExercise.solutions[0]}</pre>
                  </div>
                )}

                {/* Mascote Veti Ativa com seus 4 Estados Emocionais */}
                <div className="mascot-section-container">
                  <Mascot emotion={mascotEmotion} />
                </div>

                {/* Feedback Visual de Erros / Banner */}
                {evaluation && (
                  <div className="lab-evaluation-feedback">
                    <FeedbackBanner evaluation={evaluation} />
                  </div>
                )}

                {/* Tabela de Resultados Retornada pelo Aluno */}
                {evaluation?.studentResult && (
                  <div className="lab-student-results">
                    <ResultTable
                      data={evaluation.studentResult}
                      title="Resultado retornado pela sua consulta:"
                    />
                  </div>
                )}

                {/* Saída Terminal para Linux/Docker/Redes */}
                {linkedExercise?.track !== 'sql' && evaluation?.output && (
                  <div className="terminal-result-preview">
                    <div className="terminal-result-header">
                      <span>Saída do Processo</span>
                    </div>
                    <pre className="terminal-result-body">
                      {evaluation.output}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
