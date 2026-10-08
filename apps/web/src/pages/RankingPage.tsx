import React from 'react';
import { useProgression } from '../context/ProgressionContext';

interface StudentRankingItem {
  id: string;
  rank: number;
  name: string;
  xp: number;
  streakDays: number;
  progressPercent: number;
  isCurrentUser?: boolean;
}

interface RankingPageProps {
  onBackToDashboard: () => void;
}

export const RankingPage: React.FC<RankingPageProps> = ({ onBackToDashboard }) => {
  const { currentProfile, stats } = useProgression();

  const userXp = currentProfile?.gamification?.xp ?? 0;
  const userStreak = currentProfile?.streak?.currentStreak ?? 0;
  const userProgress = stats?.completionPercentage ?? 0;
  const userName = currentProfile?.name ?? 'Você';

  // Colegas de turma com pontuações realistas de referência semanal
  const classmates: Omit<StudentRankingItem, 'rank'>[] = [
    {
      id: 'student-1',
      name: 'Camila Fernandes',
      xp: 1850,
      streakDays: 21,
      progressPercent: 95,
    },
    {
      id: 'student-2',
      name: 'Gabriel Rocha',
      xp: 1420,
      streakDays: 18,
      progressPercent: 88,
    },
    {
      id: 'student-3',
      name: 'Mariana Duarte',
      xp: 1190,
      streakDays: 15,
      progressPercent: 82,
    },
    {
      id: 'student-5',
      name: 'Lucas Meneses',
      xp: 880,
      streakDays: 12,
      progressPercent: 71,
    },
    {
      id: 'student-6',
      name: 'Beatriz Vasconcelos',
      xp: 650,
      streakDays: 9,
      progressPercent: 64,
    },
    {
      id: 'student-7',
      name: 'Rodrigo Alves',
      xp: 420,
      streakDays: 8,
      progressPercent: 48,
    },
    {
      id: 'student-8',
      name: 'Fernanda Lima',
      xp: 250,
      streakDays: 5,
      progressPercent: 35,
    },
    {
      id: 'student-9',
      name: 'Thiago Martins',
      xp: 100,
      streakDays: 3,
      progressPercent: 20,
    },
    {
      id: 'student-10',
      name: 'Larissa Souza',
      xp: 50,
      streakDays: 2,
      progressPercent: 12,
    },
  ];

  const rankingList: Omit<StudentRankingItem, 'rank'>[] = [
    ...classmates,
    {
      id: 'current-user',
      name: userName,
      xp: userXp,
      streakDays: userStreak,
      progressPercent: userProgress,
      isCurrentUser: true,
    },
  ];

  // Ordena por XP decrescente e recalcula rank proporcional
  const sortedRanking: StudentRankingItem[] = [...rankingList]
    .sort((a, b) => b.xp - a.xp)
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

  const top3 = sortedRanking.slice(0, 3);

  return (
    <div className="ranking-page-container">
      {/* Cabeçalho do Ranking */}
      <header className="ranking-header">
        <div>
          <button
            type="button"
            className="ranking-back-link"
            onClick={onBackToDashboard}
          >
            ← Voltar ao Painel
          </button>
          <h1 className="ranking-title">Ranking Semanal da Turma</h1>
          <p className="ranking-subtitle">
            Classificação geral por XP acumulado em aulas e laboratórios. O ciclo reinicia em 3 dias.
          </p>
        </div>

        <div className="ranking-deadline-pill">
          <span className="deadline-icon">⏱️</span>
          <span className="deadline-text">Liga Ouro · 3 dias restantes</span>
        </div>
      </header>

      {/* Pódio dos Top 3 Alunos */}
      <section className="podium-section">
        {/* 2º Lugar */}
        {top3[1] && (
          <div className="podium-card silver">
            <div className="podium-badge-medal">🥈 2º</div>
            <div className="podium-avatar-wrap silver-ring">
              <span>{top3[1].name[0]}</span>
            </div>
            <h3 className="podium-student-name">{top3[1].name}</h3>
            <span className="podium-xp-number">{top3[1].xp.toLocaleString()} XP</span>
            <span className="podium-streak-pill">🔥 {top3[1].streakDays}d streak</span>
          </div>
        )}

        {/* 1º Lugar (Campeão) */}
        {top3[0] && (
          <div className="podium-card gold">
            <div className="podium-crown">👑</div>
            <div className="podium-badge-medal gold-badge">🥇 1º Lugar</div>
            <div className="podium-avatar-wrap gold-ring">
              <span>{top3[0].name[0]}</span>
            </div>
            <h3 className="podium-student-name">{top3[0].name}</h3>
            <span className="podium-xp-number gold-txt">{top3[0].xp.toLocaleString()} XP</span>
            <span className="podium-streak-pill gold-pill">🔥 {top3[0].streakDays}d streak</span>
          </div>
        )}

        {/* 3º Lugar */}
        {top3[2] && (
          <div className="podium-card bronze">
            <div className="podium-badge-medal">🥉 3º</div>
            <div className="podium-avatar-wrap bronze-ring">
              <span>{top3[2].name[0]}</span>
            </div>
            <h3 className="podium-student-name">{top3[2].name}</h3>
            <span className="podium-xp-number">{top3[2].xp.toLocaleString()} XP</span>
            <span className="podium-streak-pill">🔥 {top3[2].streakDays}d streak</span>
          </div>
        )}
      </section>

      {/* Tabela de Classificação da Turma */}
      <section className="ranking-table-card">
        <div className="ranking-table-header">
          <span className="col-pos">Posição</span>
          <span className="col-student">Estudante</span>
          <span className="col-prog">Progresso</span>
          <span className="col-streak">Sequência</span>
          <span className="col-xp">XP Semanal</span>
        </div>

        <div className="ranking-list-body">
          {sortedRanking.map((student) => {
            const isMe = student.isCurrentUser;
            return (
              <div
                key={student.id}
                className={`ranking-row-item ${isMe ? 'me' : ''}`}
              >
                <div className="col-pos">
                  <span className={`rank-number-pill rank-${student.rank}`}>
                    #{student.rank}
                  </span>
                </div>

                <div className="col-student">
                  <div className="student-avatar-mini">
                    {student.name[0]}
                  </div>
                  <div className="student-name-box">
                    <span className="student-display-name">{student.name}</span>
                    {isMe && <span className="you-tag-badge">VOCÊ</span>}
                  </div>
                </div>

                <div className="col-prog">
                  <div className="table-bar-track">
                    <div
                      className="table-bar-fill"
                      style={{ width: `${student.progressPercent}%` }}
                    />
                  </div>
                  <span className="table-pct-text">{student.progressPercent}%</span>
                </div>

                <div className="col-streak">
                  <span className="table-streak-badge">
                    🔥 {student.streakDays} dias
                  </span>
                </div>

                <div className="col-xp">
                  <span className="table-xp-value">
                    {student.xp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
