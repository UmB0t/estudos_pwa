import React from 'react';

interface DiagramViewerProps {
  diagramType:
    | 'sql-projection'
    | 'sql-distinct'
    | 'sql-alias'
    | 'sql-where'
    | 'sql-in'
    | 'b-tree'
    | 'linux-fs'
    | 'docker-layers'
    | 'tcp-handshake'
    | 'algo-search'
    | 'sec-injection';
}

export const DiagramViewer: React.FC<DiagramViewerProps> = ({ diagramType }) => {
  return (
    <div className="diagram-card-container">
      <div className="diagram-header-label">
        <span className="diagram-pulse-dot" />
        <span className="diagram-caption">Diagrama Vetorial Conceitual</span>
      </div>

      <div className="diagram-svg-wrapper">
        {diagramType === 'sql-projection' && (
          <svg viewBox="0 0 540 180" className="vetor-svg-diagram" fill="none">
            {/* Tabela Física */}
            <rect x="20" y="25" width="200" height="130" rx="8" fill="#FFFFFF" stroke="#141A3C" strokeWidth="2" />
            <rect x="20" y="25" width="200" height="32" rx="8" fill="#141A3C" />
            <text x="35" y="46" fill="#FFC83D" fontWeight="700" fontSize="13" fontFamily="monospace">Tabela: alunos</text>
            <text x="35" y="80" fill="#4A5568" fontSize="12" fontFamily="monospace">• id</text>
            <text x="35" y="102" fill="#2F4BFF" fontWeight="700" fontSize="12" fontFamily="monospace">• nome  ➔ [SELECIONADO]</text>
            <text x="35" y="124" fill="#4A5568" fontSize="12" fontFamily="monospace">• idade</text>
            <text x="35" y="146" fill="#2F4BFF" fontWeight="700" fontSize="12" fontFamily="monospace">• curso ➔ [SELECIONADO]</text>

            {/* Seta de Projeção */}
            <path d="M 235 90 L 305 90" stroke="#2F4BFF" strokeWidth="3" strokeDasharray="4 4" />
            <polygon points="315,90 300,83 300,97" fill="#2F4BFF" />
            <text x="240" y="78" fill="#2F4BFF" fontWeight="700" fontSize="11" fontFamily="sans-serif">PROJEÇÃO (SELECT)</text>

            {/* Resultado Projetado */}
            <rect x="330" y="25" width="180" height="130" rx="8" fill="#FFFFFF" stroke="#0E8F67" strokeWidth="2" />
            <rect x="330" y="25" width="180" height="32" rx="8" fill="#0E8F67" />
            <text x="345" y="46" fill="#FFFFFF" fontWeight="700" fontSize="13" fontFamily="monospace">Resultset Projetado</text>
            <text x="345" y="85" fill="#141A3C" fontWeight="700" fontSize="12" fontFamily="monospace">nome | curso</text>
            <line x1="345" y1="95" x2="495" y2="95" stroke="#D5DDEA" strokeWidth="1.5" />
            <text x="345" y="115" fill="#4A5568" fontSize="11" fontFamily="monospace">Ana  | Eng. Soft</text>
            <text x="345" y="135" fill="#4A5568" fontSize="11" fontFamily="monospace">Bruno| Ciên. Comp</text>
          </svg>
        )}

        {diagramType === 'sql-distinct' && (
          <svg viewBox="0 0 540 180" className="vetor-svg-diagram" fill="none">
            {/* Lista com duplicatas */}
            <rect x="20" y="30" width="160" height="120" rx="8" fill="#FFFFFF" stroke="#141A3C" strokeWidth="2" />
            <text x="35" y="55" fill="#141A3C" fontWeight="700" fontSize="12">Linhas com repetição</text>
            <text x="35" y="80" fill="#D6355F" fontSize="12" fontFamily="monospace">• São Paulo</text>
            <text x="35" y="100" fill="#0E8F67" fontSize="12" fontFamily="monospace">• Campinas</text>
            <text x="35" y="120" fill="#D6355F" fontSize="12" fontFamily="monospace">• São Paulo (repetido)</text>
            <text x="35" y="140" fill="#0284C7" fontSize="12" fontFamily="monospace">• Santos</text>

            {/* Filtro Hash / DISTINCT */}
            <circle cx="270" cy="90" r="45" fill="#EEF2FF" stroke="#2F4BFF" strokeWidth="2.5" />
            <text x="238" y="86" fill="#2F4BFF" fontWeight="800" fontSize="13">DISTINCT</text>
            <text x="242" y="103" fill="#4A5568" fontSize="10">Hash/Sort</text>

            {/* Setas */}
            <path d="M 185 90 L 220 90" stroke="#2F4BFF" strokeWidth="2.5" />
            <path d="M 320 90 L 355 90" stroke="#0E8F67" strokeWidth="2.5" />

            {/* Conjunto Único */}
            <rect x="360" y="30" width="160" height="120" rx="8" fill="#FFFFFF" stroke="#0E8F67" strokeWidth="2" />
            <text x="375" y="55" fill="#0E8F67" fontWeight="700" fontSize="12">Conjunto Único</text>
            <text x="375" y="82" fill="#141A3C" fontSize="12" fontFamily="monospace">✓ São Paulo</text>
            <text x="375" y="105" fill="#141A3C" fontSize="12" fontFamily="monospace">✓ Campinas</text>
            <text x="375" y="128" fill="#141A3C" fontSize="12" fontFamily="monospace">✓ Santos</text>
          </svg>
        )}

        {diagramType === 'sql-alias' && (
          <svg viewBox="0 0 540 160" className="vetor-svg-diagram" fill="none">
            <rect x="30" y="30" width="180" height="100" rx="8" fill="#FFFFFF" stroke="#141A3C" strokeWidth="2" />
            <text x="45" y="55" fill="#64748B" fontWeight="600" fontSize="11">Coluna Física (Disco)</text>
            <text x="45" y="85" fill="#141A3C" fontWeight="700" fontSize="14" fontFamily="monospace">curso</text>
            <text x="45" y="110" fill="#141A3C" fontWeight="700" fontSize="14" fontFamily="monospace">cidade</text>

            <path d="M 220 80 L 310 80" stroke="#2F4BFF" strokeWidth="3" markerEnd="url(#arrow)" />
            <text x="245" y="72" fill="#2F4BFF" fontWeight="800" fontSize="13">AS</text>

            <rect x="330" y="30" width="180" height="100" rx="8" fill="#FFF7DB" stroke="#FFC83D" strokeWidth="2" />
            <text x="345" y="55" fill="#92400E" fontWeight="600" fontSize="11">Rótulo Virtual (API/UI)</text>
            <text x="345" y="85" fill="#141A3C" fontWeight="800" fontSize="14" fontFamily="monospace">graduacao</text>
            <text x="345" y="110" fill="#141A3C" fontWeight="800" fontSize="14" fontFamily="monospace">campus</text>
          </svg>
        )}

        {diagramType === 'sql-where' && (
          <svg viewBox="0 0 540 180" className="vetor-svg-diagram" fill="none">
            <rect x="20" y="20" width="160" height="140" rx="8" fill="#FFFFFF" stroke="#141A3C" strokeWidth="2" />
            <text x="35" y="45" fill="#141A3C" fontWeight="700" fontSize="12">Todas as Tuplas</text>
            <text x="35" y="70" fill="#4A5568" fontSize="11" fontFamily="monospace">Ana (20 anos)</text>
            <text x="35" y="95" fill="#4A5568" fontSize="11" fontFamily="monospace">Lucas (17 anos)</text>
            <text x="35" y="120" fill="#4A5568" fontSize="11" fontFamily="monospace">Bruno (22 anos)</text>
            <text x="35" y="145" fill="#4A5568" fontSize="11" fontFamily="monospace">Julia (16 anos)</text>

            {/* Filtro WHERE */}
            <polygon points="260,30 330,90 260,150 190,90" fill="#2F4BFF" stroke="#141A3C" strokeWidth="2" />
            <text x="215" y="85" fill="#FFFFFF" fontWeight="800" fontSize="11">WHERE</text>
            <text x="205" y="102" fill="#FFC83D" fontWeight="700" fontSize="10">idade &gt;= 18</text>

            {/* Saída descartada */}
            <path d="M 260 150 L 260 170" stroke="#D6355F" strokeWidth="2" />
            <text x="270" y="170" fill="#D6355F" fontSize="10" fontWeight="700">✕ Descarte (FALSE)</text>

            {/* Saída aprovada */}
            <path d="M 330 90 L 375 90" stroke="#0E8F67" strokeWidth="3" />
            <rect x="380" y="35" width="140" height="110" rx="8" fill="#FFFFFF" stroke="#0E8F67" strokeWidth="2" />
            <text x="395" y="60" fill="#0E8F67" fontWeight="700" fontSize="12">Resultado Aprovado</text>
            <text x="395" y="85" fill="#141A3C" fontSize="11" fontFamily="monospace">✓ Ana (20)</text>
            <text x="395" y="110" fill="#141A3C" fontSize="11" fontFamily="monospace">✓ Bruno (22)</text>
          </svg>
        )}

        {diagramType === 'sql-in' && (
          <svg viewBox="0 0 540 160" className="vetor-svg-diagram" fill="none">
            <rect x="30" y="30" width="180" height="100" rx="8" fill="#FFFFFF" stroke="#141A3C" strokeWidth="2" />
            <text x="45" y="55" fill="#4A5568" fontSize="12" fontWeight="700">Campo Testado</text>
            <text x="45" y="85" fill="#2F4BFF" fontSize="14" fontWeight="800" fontFamily="monospace">curso IN (...)</text>

            <path d="M 220 80 L 290 80" stroke="#2F4BFF" strokeWidth="3" />
            <circle cx="300" cy="80" r="10" fill="#2F4BFF" />
            <text x="296" y="84" fill="#FFFFFF" fontSize="12" fontWeight="800">∈</text>

            <rect x="320" y="25" width="190" height="110" rx="12" fill="#EEF2FF" stroke="#2F4BFF" strokeWidth="2" strokeDasharray="5 5" />
            <text x="335" y="50" fill="#2F4BFF" fontSize="12" fontWeight="800">Conjunto Permitido</text>
            <rect x="335" y="60" width="160" height="26" rx="4" fill="#FFFFFF" stroke="#CBD5E1" />
            <text x="345" y="78" fill="#141A3C" fontSize="11" fontFamily="monospace">'Ciência da Computação'</text>
            <rect x="335" y="95" width="160" height="26" rx="4" fill="#FFFFFF" stroke="#CBD5E1" />
            <text x="345" y="113" fill="#141A3C" fontSize="11" fontFamily="monospace">'Sistemas de Informação'</text>
          </svg>
        )}

        {diagramType === 'b-tree' && (
          <svg viewBox="0 0 540 180" className="vetor-svg-diagram" fill="none">
            {/* Raiz */}
            <rect x="220" y="15" width="100" height="35" rx="6" fill="#141A3C" stroke="#2F4BFF" strokeWidth="2" />
            <text x="248" y="38" fill="#FFC83D" fontWeight="800" fontSize="13">Raiz [50]</text>

            <line x1="240" y1="50" x2="150" y2="85" stroke="#141A3C" strokeWidth="2" />
            <line x1="300" y1="50" x2="390" y2="85" stroke="#141A3C" strokeWidth="2" />

            {/* Nível Intermediário */}
            <rect x="90" y="85" width="120" height="35" rx="6" fill="#EEF2FF" stroke="#2F4BFF" strokeWidth="2" />
            <text x="110" y="107" fill="#141A3C" fontWeight="700" fontSize="12">[20 | 35]</text>

            <rect x="330" y="85" width="120" height="35" rx="6" fill="#EEF2FF" stroke="#2F4BFF" strokeWidth="2" />
            <text x="350" y="107" fill="#141A3C" fontWeight="700" fontSize="12">[65 | 80]</text>

            {/* Folhas com ponteiro para disco */}
            <text x="115" y="155" fill="#0E8F67" fontWeight="700" fontSize="11" fontFamily="monospace">➔ Disco (Page 12)</text>
            <text x="355" y="155" fill="#0E8F67" fontWeight="700" fontSize="11" fontFamily="monospace">➔ Disco (Page 48)</text>
          </svg>
        )}

        {diagramType === 'linux-fs' && (
          <svg viewBox="0 0 540 160" className="vetor-svg-diagram" fill="none">
            <rect x="235" y="15" width="70" height="32" rx="6" fill="#141A3C" />
            <text x="264" y="37" fill="#FFC83D" fontWeight="800" fontSize="16">/</text>

            <line x1="250" y1="47" x2="100" y2="80" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="270" y1="47" x2="270" y2="80" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="290" y1="47" x2="440" y2="80" stroke="#CBD5E1" strokeWidth="2" />

            <rect x="60" y="80" width="80" height="30" rx="4" fill="#FFFFFF" stroke="#141A3C" strokeWidth="1.5" />
            <text x="80" y="100" fill="#141A3C" fontWeight="700" fontSize="12">/home</text>

            <rect x="230" y="80" width="80" height="30" rx="4" fill="#FFFFFF" stroke="#141A3C" strokeWidth="1.5" />
            <text x="254" y="100" fill="#141A3C" fontWeight="700" fontSize="12">/etc</text>

            <rect x="400" y="80" width="80" height="30" rx="4" fill="#FFFFFF" stroke="#141A3C" strokeWidth="1.5" />
            <text x="424" y="100" fill="#141A3C" fontWeight="700" fontSize="12">/var</text>

            <line x1="100" y1="110" x2="100" y2="135" stroke="#2F4BFF" strokeWidth="2" strokeDasharray="3 3" />
            <text x="65" y="150" fill="#2F4BFF" fontWeight="700" fontSize="11" fontFamily="monospace">~/estudante</text>
          </svg>
        )}

        {diagramType === 'docker-layers' && (
          <svg viewBox="0 0 540 170" className="vetor-svg-diagram" fill="none">
            <rect x="120" y="20" width="300" height="32" rx="6" fill="#DDF7EC" stroke="#0E8F67" strokeWidth="2" />
            <text x="140" y="41" fill="#0E8F67" fontWeight="800" fontSize="12">Container Layer (Read/Write Temporário)</text>

            <rect x="120" y="60" width="300" height="30" rx="6" fill="#EEF2FF" stroke="#2F4BFF" strokeWidth="1.5" />
            <text x="140" y="80" fill="#2F4BFF" fontWeight="700" fontSize="12">App Code / Nginx Config (Read-Only)</text>

            <rect x="120" y="98" width="300" height="30" rx="6" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
            <text x="140" y="118" fill="#475569" fontWeight="700" fontSize="12">Debian / Alpine Base Image (Read-Only)</text>

            <rect x="120" y="136" width="300" height="24" rx="4" fill="#141A3C" />
            <text x="195" y="152" fill="#FFC83D" fontWeight="700" fontSize="11">Host Kernel (Linux)</text>
          </svg>
        )}

        {diagramType === 'tcp-handshake' && (
          <svg viewBox="0 0 540 160" className="vetor-svg-diagram" fill="none">
            <text x="80" y="30" fill="#141A3C" fontWeight="800" fontSize="13">Cliente (Browser/cURL)</text>
            <text x="360" y="30" fill="#141A3C" fontWeight="800" fontSize="13">Servidor (Web API)</text>

            <line x1="140" y1="40" x2="140" y2="150" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="420" y1="40" x2="420" y2="150" stroke="#CBD5E1" strokeWidth="2" />

            {/* 1. SYN */}
            <path d="M 140 60 L 420 80" stroke="#2F4BFF" strokeWidth="2" />
            <text x="240" y="65" fill="#2F4BFF" fontWeight="700" fontSize="11">1. SYN</text>

            {/* 2. SYN-ACK */}
            <path d="M 420 90 L 140 110" stroke="#0E8F67" strokeWidth="2" />
            <text x="240" y="98" fill="#0E8F67" fontWeight="700" fontSize="11">2. SYN-ACK</text>

            {/* 3. ACK */}
            <path d="M 140 120 L 420 140" stroke="#141A3C" strokeWidth="2" />
            <text x="240" y="128" fill="#141A3C" fontWeight="700" fontSize="11">3. ACK (ESTABLISHED)</text>
          </svg>
        )}

        {diagramType === 'algo-search' && (
          <svg viewBox="0 0 540 160" className="vetor-svg-diagram" fill="none">
            <text x="30" y="30" fill="#D6355F" fontWeight="800" fontSize="12">Busca Linear: O(n)</text>
            <rect x="30" y="40" width="220" height="35" rx="6" fill="#FFE1E8" stroke="#D6355F" strokeWidth="1.5" />
            <text x="40" y="62" fill="#141A3C" fontSize="11" fontFamily="monospace">1 ➔ 2 ➔ 3 ➔ ... ➔ N (1 a 1)</text>

            <text x="290" y="30" fill="#0E8F67" fontWeight="800" fontSize="12">Busca Binária: O(log n)</text>
            <rect x="290" y="40" width="220" height="35" rx="6" fill="#DDF7EC" stroke="#0E8F67" strokeWidth="1.5" />
            <text x="300" y="62" fill="#141A3C" fontSize="11" fontFamily="monospace">[ metade descartada ] ➔ O(18)</text>

            <rect x="110" y="95" width="320" height="45" rx="8" fill="#141A3C" />
            <text x="130" y="122" fill="#FFC83D" fontWeight="700" fontSize="12">1.000.000 itens: Linear = 1.000.000 op | Binária = 20 op</text>
          </svg>
        )}

        {diagramType === 'sec-injection' && (
          <svg viewBox="0 0 540 170" className="vetor-svg-diagram" fill="none">
            <rect x="20" y="20" width="230" height="65" rx="6" fill="#FFE1E8" stroke="#D6355F" strokeWidth="2" />
            <text x="30" y="40" fill="#D6355F" fontWeight="800" fontSize="11">VULNERÁVEL: Concatenação</text>
            <text x="30" y="60" fill="#141A3C" fontSize="10" fontFamily="monospace">"SELECT * FROM u WHERE id = " + id</text>
            <text x="30" y="75" fill="#D6355F" fontSize="9">Entrada altera a gramática da query!</text>

            <rect x="280" y="20" width="240" height="65" rx="6" fill="#DDF7EC" stroke="#0E8F67" strokeWidth="2" />
            <text x="290" y="40" fill="#0E8F67" fontWeight="800" fontSize="11">SEGURO: Prepared Statement</text>
            <text x="290" y="60" fill="#141A3C" fontSize="10" fontFamily="monospace">"SELECT * FROM u WHERE id = $1"</text>
            <text x="290" y="75" fill="#0E8F67" fontSize="9">Entrada é tratada exclusivamente como dado literal.</text>

            <path d="M 270 95 L 270 145" stroke="#141A3C" strokeWidth="2" />
            <rect x="130" y="105" width="280" height="40" rx="8" fill="#141A3C" />
            <text x="150" y="130" fill="#FFC83D" fontWeight="800" fontSize="12">Blindagem: Separação de Código e Dados</text>
          </svg>
        )}
      </div>
    </div>
  );
};
