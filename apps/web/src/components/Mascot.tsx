import React from 'react';

export type MascotEmotion = 'idle' | 'thinking' | 'celebrating' | 'disapproval';

interface MascotProps {
  emotion: MascotEmotion;
  customMessage?: string;
}

export const Mascot: React.FC<MascotProps> = ({ emotion, customMessage }) => {
  const getDefaultMessage = (): string => {
    switch (emotion) {
      case 'thinking':
        return 'Hummm... analisando sua consulta no banco de dados!';
      case 'celebrating':
        return 'Mandou bem demais! Consulta perfeita e resultado validado! 🎉';
      case 'disapproval':
        return 'Ops! Algo não saiu como esperado. Dê uma olhada no erro abaixo e tente de novo!';
      case 'idle':
      default:
        return 'Pronto para os estudos! Digite seu comando e vamos testar.';
    }
  };

  const message = customMessage ?? getDefaultMessage();

  return (
    <div className={`vetor-mascot-card emotion-${emotion}`}>
      <div className="mascot-avatar-wrap">
        <svg
          className="mascot-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sombra base */}
          <ellipse cx="50" cy="94" rx="28" ry="5" fill="#D5DDEA" />

          {/* Antena */}
          <path
            d="M 50 25 L 50 14"
            stroke="#141A3C"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="11"
            r={emotion === 'thinking' ? 6 : emotion === 'celebrating' ? 6.5 : 5}
            fill={
              emotion === 'celebrating'
                ? '#0E8F67'
                : emotion === 'thinking'
                  ? '#2F4BFF'
                  : emotion === 'disapproval'
                    ? '#D6355F'
                    : '#FFC83D'
            }
            stroke="#141A3C"
            strokeWidth="2.5"
            className={emotion === 'thinking' ? 'antenna-pulse' : ''}
          />

          {/* Corpo do Robô/Corujinha Vetor */}
          <rect
            x="20"
            y="24"
            width="60"
            height="58"
            rx="18"
            fill="#FFC83D"
            stroke="#141A3C"
            strokeWidth="3.5"
          />

          {/* Orelhas / Abas laterais */}
          <path
            d="M 16 38 C 11 38 10 48 16 52"
            fill="#141A3C"
            stroke="#141A3C"
            strokeWidth="2"
          />
          <path
            d="M 84 38 C 89 38 90 48 84 52"
            fill="#141A3C"
            stroke="#141A3C"
            strokeWidth="2"
          />

          {/* Visor / Tela do Rosto */}
          <rect
            x="28"
            y="32"
            width="44"
            height="34"
            rx="10"
            fill="#1E2652"
            stroke="#141A3C"
            strokeWidth="2.5"
          />

          {/* Olhos e Expressão conforme Estado */}
          {emotion === 'idle' && (
            <g className="mascot-eyes-idle">
              {/* Olho Esquerdo */}
              <circle cx="41" cy="48" r="5" fill="#FFC83D" />
              <circle cx="43" cy="46" r="1.8" fill="#FFFFFF" />
              {/* Olho Direito */}
              <circle cx="59" cy="48" r="5" fill="#FFC83D" />
              <circle cx="61" cy="46" r="1.8" fill="#FFFFFF" />
              {/* Boquinha relaxada */}
              <path
                d="M 47 55 Q 50 58 53 55"
                stroke="#FFC83D"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}

          {emotion === 'thinking' && (
            <g className="mascot-eyes-thinking">
              {/* Olho esquerdo curioso olhando pra cima */}
              <circle cx="41" cy="45" r="5.5" fill="#2F4BFF" />
              <circle cx="43" cy="43" r="2" fill="#FFFFFF" />
              {/* Olho direito semicerrado/focado */}
              <circle cx="59" cy="46" r="4.5" fill="#2F4BFF" />
              <circle cx="61" cy="44" r="1.8" fill="#FFFFFF" />
              {/* Boquinha "o" */}
              <circle cx="50" cy="55" r="2.5" fill="#2F4BFF" />
            </g>
          )}

          {emotion === 'celebrating' && (
            <g className="mascot-eyes-celebrating">
              {/* Olhos de alegria estrela/arcos felizes */}
              <path
                d="M 37 49 Q 41 43 45 49"
                stroke="#0E8F67"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 55 49 Q 59 43 63 49"
                stroke="#0E8F67"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Bochechas coradas */}
              <circle cx="33" cy="53" r="3" fill="#FFE1E8" />
              <circle cx="67" cy="53" r="3" fill="#FFE1E8" />
              {/* Sorriso grande */}
              <path
                d="M 44 54 Q 50 61 56 54"
                stroke="#0E8F67"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
              {/* Brilhos de vitória ao redor */}
              <path
                d="M 20 18 L 22 22 L 26 24 L 22 26 L 20 30 L 18 26 L 14 24 L 18 22 Z"
                fill="#FFC83D"
              />
              <path
                d="M 80 18 L 82 22 L 86 24 L 82 26 L 80 30 L 78 26 L 74 24 L 78 22 Z"
                fill="#FFC83D"
              />
            </g>
          )}

          {emotion === 'disapproval' && (
            <g className="mascot-eyes-disapproval">
              {/* Olhos compreensivos/tristonhos */}
              <circle cx="41" cy="48" r="4.5" fill="#D6355F" />
              <circle cx="42" cy="47" r="1.5" fill="#FFFFFF" />
              <circle cx="59" cy="48" r="4.5" fill="#D6355F" />
              <circle cx="60" cy="47" r="1.5" fill="#FFFFFF" />
              {/* Sobrancelhas caídas */}
              <path
                d="M 36 41 L 44 44"
                stroke="#141A3C"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 64 41 L 56 44"
                stroke="#141A3C"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Boquinha tristonha suave */}
              <path
                d="M 46 57 Q 50 54 54 57"
                stroke="#D6355F"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Gotinha de suor simpática */}
              <path
                d="M 72 38 C 70 41 68 45 72 47 C 76 45 74 41 72 38 Z"
                fill="#0284C7"
              />
            </g>
          )}

          {/* Pés */}
          <rect
            x="34"
            y="82"
            width="10"
            height="7"
            rx="3"
            fill="#141A3C"
          />
          <rect
            x="56"
            y="82"
            width="10"
            height="7"
            rx="3"
            fill="#141A3C"
          />
        </svg>
      </div>

      <div className="mascot-bubble">
        <div className="mascot-name-tag">
          <span className="mascot-badge-dot" />
          <span className="mascot-name">Veti</span>
          <span className="mascot-role">Seu Tutor de Estudos</span>
        </div>
        <p className="mascot-text">{message}</p>
      </div>
    </div>
  );
};
