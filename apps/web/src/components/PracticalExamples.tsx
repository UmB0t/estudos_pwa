import React, { useState } from 'react';
import type { PracticalScenario } from '../content/guidedContent';
import { ResultTable } from './ResultTable';

interface PracticalExamplesProps {
  examples: PracticalScenario[];
  onProceedToLab: () => void;
}

export const PracticalExamples: React.FC<PracticalExamplesProps> = ({
  examples,
  onProceedToLab,
}) => {
  const [selectedId, setSelectedId] = useState<string>(examples[0]?.id ?? '');

  const activeScenario = examples.find((ex) => ex.id === selectedId) ?? examples[0];
  if (!activeScenario) {
    return null;
  }

  const isTableData =
    typeof activeScenario.outputPreview === 'object' &&
    activeScenario.outputPreview !== null &&
    'columns' in activeScenario.outputPreview &&
    'rows' in activeScenario.outputPreview;

  return (
    <div className="practical-examples-container">
      <div className="examples-header-section">
        <span className="step-tag-pill">Passo 2 · Teoria Prática</span>
        <h3 className="examples-main-title">Exemplos Prontos & Cenários de Execução</h3>
        <p className="examples-intro-text">
          Selecione os cenários abaixo para observar o comportamento da engine e a estrutura de dados retornada antes de programar no laboratório.
        </p>

        {/* Chips / Pílulas Selecionáveis */}
        <div className="scenario-chips-row">
          {examples.map((scenario) => {
            const isSelected = scenario.id === activeScenario.id;
            return (
              <button
                key={scenario.id}
                type="button"
                className={`scenario-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedId(scenario.id)}
              >
                <span className="chip-indicator" />
                <span className="chip-label">{scenario.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bloco de Código / Terminal Formatado */}
      <div className="code-example-card">
        <div className="example-terminal-header">
          <div className="terminal-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <span className="terminal-filename">instrucao_exemplo.sql</span>
          <span className="terminal-scenario-badge">{activeScenario.label}</span>
        </div>

        <pre className="example-code-pre">
          <code>{activeScenario.code}</code>
        </pre>
      </div>

      {/* Área de Saída Esperada do Banco */}
      <div className="expected-output-section">
        <div className="output-section-header">
          <span className="output-badge-icon">📊</span>
          <h4 className="output-heading">Saída Esperada da Engine</h4>
        </div>

        {isTableData ? (
          <ResultTable
            data={activeScenario.outputPreview as { columns: string[]; rows: (string | number | boolean | null)[][] }}
            title="Resultset Esperado no PostgreSQL:"
          />
        ) : (
          <div className="example-stdout-box">
            <pre className="example-stdout-text">
              {String(activeScenario.outputPreview)}
            </pre>
          </div>
        )}
      </div>

      {/* Explicação Didática do Resultado */}
      <div className="didactic-explanation-card">
        <div className="didactic-title-row">
          <span className="didactic-icon">💡</span>
          <h4 className="didactic-title">Análise Didática do Resultado:</h4>
        </div>
        <p className="didactic-text">{activeScenario.explanation}</p>
      </div>

      {/* Botão de Transição para o Laboratório */}
      <div className="transition-to-lab-bar">
        <div className="transition-hint">
          <span>Pronto para colocar a mão na massa?</span>
        </div>
        <button
          type="button"
          className="btn-transition-lab"
          onClick={onProceedToLab}
        >
          Ir para o laboratório ➔
        </button>
      </div>
    </div>
  );
};
