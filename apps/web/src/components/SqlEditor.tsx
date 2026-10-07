import React, { useRef } from 'react';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  disabled?: boolean;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({
  value,
  onChange,
  onExecute,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Atalho Ctrl+Enter ou Cmd+Enter para disparar verificação
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onExecute();
      return;
    }

    // Captura de Tab para inserir 2 espaços sem perder o foco
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '  ';

      const newValue = value.substring(0, start) + spaces + value.substring(end);
      onChange(newValue);

      // Reposiciona o cursor após os espaços inseridos
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      });
    }
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <div className="terminal-title">
          <span>psql (PostgreSQL 16 · PGlite WASM)</span>
        </div>
        <div className="terminal-hint">
          <kbd className="kbd-key">Ctrl</kbd>+<kbd className="kbd-key">Enter</kbd>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="terminal-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="-- Digite sua consulta SQL aqui&#10;SELECT * FROM alunos;&#10;"
        disabled={disabled}
        spellCheck={false}
      />
    </div>
  );
};
