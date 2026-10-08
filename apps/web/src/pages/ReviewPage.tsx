import React, { useState } from 'react';
import { useProgression } from '../context/ProgressionContext';

export interface Flashcard {
  id: string;
  category: string;
  question: string;
  answer: string;
  keyConcept: string;
  exampleSnippet?: string;
}

const DEFAULT_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    category: 'PostgreSQL & Álgebra Relacional',
    question: 'Qual a ordem lógica de execução das cláusulas principais em uma consulta SQL?',
    answer:
      'A ordem de avaliação lógica da engine é: 1. FROM (e JOINs) ➔ 2. WHERE ➔ 3. GROUP BY ➔ 4. HAVING ➔ 5. SELECT (Projeção) ➔ 6. DISTINCT ➔ 7. ORDER BY ➔ 8. LIMIT.',
    keyConcept: 'Ordem de Avaliação Lógica',
    exampleSnippet: 'FROM ➔ WHERE ➔ GROUP BY ➔ HAVING ➔ SELECT ➔ ORDER BY',
  },
  {
    id: 'fc-2',
    category: 'Bancos de Dados & Índices',
    question: 'Qual a diferença crucial entre Seq Scan (varredura sequencial) e Index Scan no PostgreSQL?',
    answer:
      'O Seq Scan lê página por página do arquivo heap da tabela em disco (custo O(n)). O Index Scan navega pela árvore balanceada B-Tree (custo O(log n)) para recuperar diretamente apenas os ponteiros das tuplas solicitadas.',
    keyConcept: 'B-Tree vs Heap Scan',
    exampleSnippet: 'EXPLAIN ANALYZE SELECT * FROM alunos WHERE id = 42;',
  },
  {
    id: 'fc-3',
    category: 'PostgreSQL & Constraints',
    question: 'Qual a diferença entre uma PRIMARY KEY e uma UNIQUE CONSTRAINT?',
    answer:
      'Ambas garantem unicidade através de índices B-Tree, mas a PRIMARY KEY proíbe estritamente valores NULL (NOT NULL implícito) e identifica a chave relacional da entidade. Uma UNIQUE constraint permite armazenar valores NULL (no SQL standard, múltiplos NULLs são aceitos).',
    keyConcept: 'Integridade Referencial',
  },
  {
    id: 'fc-4',
    category: 'PostgreSQL & Projeção',
    question: 'Por que a cláusula WHERE não consegue filtrar o resultado de funções agregadas como COUNT() ou AVG()?',
    answer:
      'Porque a cláusula WHERE é avaliada ANTES de o agrupamento de linhas ocorrer. Para filtrar o resultado de funções de agregação, é obrigatório utilizar a cláusula HAVING.',
    keyConcept: 'WHERE vs HAVING',
    exampleSnippet: 'SELECT curso, COUNT(*) FROM alunos GROUP BY curso HAVING COUNT(*) > 5;',
  },
  {
    id: 'fc-5',
    category: 'Linux & POSIX',
    question: 'O que representam as permissões "chmod 755" em um arquivo ou diretório?',
    answer:
      '7 (rwx = 4+2+1) para o Proprietário (Owner); 5 (r-x = 4+0+1) para o Grupo (Group); 5 (r-x = 4+0+1) para Outros (Others). O dono tem controle total e os demais podem ler e executar.',
    keyConcept: 'Máscara Octal Unix',
    exampleSnippet: 'chmod 755 script.sh',
  },
  {
    id: 'fc-6',
    category: 'Linux & I/O Streams',
    question: 'Qual a diferença entre os operadores de redirecionamento ">" e ">>" no Shell Bash?',
    answer:
      'O operador simples ">" trunca (sobrescreve) o arquivo de destino do zero. O operador duplo ">>" preserva o conteúdo existente e anexa a nova saída no final do arquivo (append).',
    keyConcept: 'Redirecionamento de Fluxo',
    exampleSnippet: 'echo "novo" > arquivo.txt  vs  echo "novo" >> arquivo.txt',
  },
  {
    id: 'fc-7',
    category: 'Redes de Computadores',
    question: 'Quais etapas compõem o 3-Way Handshake para estabelecimento de conexão TCP?',
    answer:
      '1. O cliente envia pacote SYN (Synchronize). 2. O servidor responde com SYN-ACK (Synchronize-Acknowledgment). 3. O cliente devolve ACK. A conexão atinge o estado ESTABLISHED.',
    keyConcept: 'Camada de Transporte TCP',
    exampleSnippet: 'Cliente ➔ [SYN] ➔ Servidor ➔ [SYN-ACK] ➔ Cliente ➔ [ACK] ➔ ESTABLISHED',
  },
  {
    id: 'fc-8',
    category: 'Redes & Sockets',
    question: 'O que significa um socket estar no estado "LISTEN" no sistema operacional?',
    answer:
      'Indica que um processo do servidor realizou as chamadas bind() e listen() em uma porta TCP específica e está em modo de espera passivo aguardando novas conexões de clientes.',
    keyConcept: 'Ciclo de Sockets de Rede',
    exampleSnippet: 'ss -tulpn | grep LISTEN',
  },
  {
    id: 'fc-9',
    category: 'Cloud & Contêineres (Docker)',
    question: 'Como funciona a técnica de camadas Copy-on-Write (CoW) em imagens e containers Docker?',
    answer:
      'As camadas da imagem base são somente-leitura (read-only) e compartilhadas entre todos os containers. Quando um container modifica um arquivo, o Docker copia o arquivo para a camada fina superior de leitura/escrita (R/W layer) exclusiva daquele container.',
    keyConcept: 'Union File System & CoW',
  },
  {
    id: 'fc-10',
    category: 'Segurança de Aplicações (AppSec)',
    question: 'Como Prepared Statements eliminam definitivamente a vulnerabilidade de SQL Injection?',
    answer:
      'Prepared Statements compilam a árvore sintática (AST) do comando SQL antes de receber os argumentos. A engine trata os dados do usuário estritamente como literais de dados e nunca como instruções de controle executáveis.',
    keyConcept: 'Parametrização Segura',
    exampleSnippet: 'SELECT * FROM usuarios WHERE email = $1;',
  },
];

interface ReviewPageProps {
  onBackToDashboard: () => void;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({ onBackToDashboard }) => {
  const { recordDailyActivity } = useProgression();
  const [cards] = useState<Flashcard[]>(DEFAULT_FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [reviewAgainIds, setReviewAgainIds] = useState<Set<string>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);

  const currentCard = cards[currentIndex] ?? cards[0]!;
  const totalCards = cards.length;
  const masteredCount = masteredIds.size;
  const progressPercent = Math.round(((currentIndex) / totalCards) * 100);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleAnswer = (correct: boolean) => {
    const cardId = currentCard.id;
    if (correct) {
      setMasteredIds((prev) => new Set(prev).add(cardId));
      setReviewAgainIds((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    } else {
      setReviewAgainIds((prev) => new Set(prev).add(cardId));
      setMasteredIds((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }

    setIsFlipped(false);

    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      recordDailyActivity(30).catch((err) => {
        console.error('[ReviewPage] Erro ao registrar atividade:', err);
      });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds(new Set());
    setReviewAgainIds(new Set());
    setIsCompleted(false);
  };

  if (isCompleted) {
    const finalPercent = Math.round((masteredCount / totalCards) * 100);
    return (
      <div className="review-page-container">
        <div className="review-completed-card">
          <div className="completed-confetti-badge">🎉</div>
          <h2 className="completed-title">Sessão de Revisão Concluída!</h2>
          <p className="completed-subtitle">
            Você revisou todos os {totalCards} cartões programados para o seu ciclo de repetição espaçada.
          </p>

          <div className="completed-metrics-row">
            <div className="metric-box success">
              <span className="metric-number">{masteredCount}</span>
              <span className="metric-label">Cartões Dominados</span>
            </div>
            <div className="metric-box review">
              <span className="metric-number">{reviewAgainIds.size}</span>
              <span className="metric-label">A Revisar em Breve</span>
            </div>
            <div className="metric-box score">
              <span className="metric-number">{finalPercent}%</span>
              <span className="metric-label">Aproveitamento</span>
            </div>
          </div>

          <div className="completed-actions">
            <button
              type="button"
              className="btn btn-yel-action"
              onClick={handleRestart}
            >
              Recomeçar Revisão ↺
            </button>
            <button
              type="button"
              className="btn ghost-navy"
              onClick={onBackToDashboard}
            >
              Voltar ao Painel Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page-container">
      {/* Header com Progresso & Estatísticas */}
      <header className="review-header">
        <div>
          <button
            type="button"
            className="review-back-link"
            onClick={onBackToDashboard}
          >
            ← Voltar ao Painel
          </button>
          <h1 className="review-title">Revisão com Flashcards</h1>
          <p className="review-subtitle">
            Repetição espaçada com autoavaliação ativa para consolidação da memória de longo prazo.
          </p>
        </div>

        <div className="review-stats-pill">
          <span className="pill-strong">{masteredCount} dominados</span>
          <span className="pill-sep">·</span>
          <span className="pill-light">{totalCards - masteredCount} restantes</span>
        </div>
      </header>

      {/* Barra de Progresso da Sessão */}
      <div className="review-progress-track">
        <div
          className="review-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Contêiner 3D do Flashcard com Animação de Flip */}
      <div className="flashcard-scene" onClick={handleFlip}>
        <div className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}>
          {/* FRENTE DO CARTÃO (Pergunta em Azul) */}
          <div className="flashcard-face flashcard-front">
            <div className="face-header">
              <span className="card-category-tag">{currentCard.category}</span>
              <span className="card-index-tag">
                Cartão {currentIndex + 1} de {totalCards}
              </span>
            </div>

            <div className="face-body">
              <span className="card-prompt-label">Pergunta:</span>
              <h2 className="card-question-text">{currentCard.question}</h2>
            </div>

            <div className="face-footer">
              <span className="flip-instruction-pill">
                ↻ Clique em qualquer ponto para virar o cartão e ver a resposta
              </span>
            </div>
          </div>

          {/* VERSO DO CARTÃO (Resposta em Amarelo / Destaque) */}
          <div className="flashcard-face flashcard-back">
            <div className="face-header">
              <span className="card-category-tag back">{currentCard.keyConcept}</span>
              <span className="card-index-tag">
                Cartão {currentIndex + 1} de {totalCards}
              </span>
            </div>

            <div className="face-body">
              <span className="card-answer-label">Resposta Didática:</span>
              <p className="card-answer-text">{currentCard.answer}</p>

              {currentCard.exampleSnippet && (
                <div className="card-snippet-box">
                  <span className="snippet-label">Exemplo Mnemônico:</span>
                  <pre className="snippet-code">{currentCard.exampleSnippet}</pre>
                </div>
              )}
            </div>

            <div className="face-footer">
              <span className="flip-instruction-pill back">
                ↺ Clique para alternar para a pergunta
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Autoavaliação */}
      <div className="review-assessment-bar">
        <button
          type="button"
          className="btn-assess wrong"
          onClick={(e) => {
            e.stopPropagation();
            handleAnswer(false);
          }}
          title="Marcar como 'Errei' para repetir na próxima rodada"
        >
          <span className="assess-icon">🔴</span>
          <span className="assess-label">Errei / Preciso revisar</span>
        </button>

        <button
          type="button"
          className="btn-assess correct"
          onClick={(e) => {
            e.stopPropagation();
            handleAnswer(true);
          }}
          title="Marcar como 'Acertei' e consolidar o conceito"
        >
          <span className="assess-icon">🟢</span>
          <span className="assess-label">Acertei / Dominado</span>
        </button>
      </div>
    </div>
  );
};
