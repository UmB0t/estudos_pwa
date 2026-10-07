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
    <div className="editor-container">
      <div className="editor-toolbar">
        <span className="editor-title">Editor SQL (PostgreSQL)</span>
        <span className="shortcut-hint">
          Pressione <span className="shortcut-key">Ctrl+Enter</span> para verificar
        </span>
      </div>
      <textarea
        ref={textareaRef}
        className="sql-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escreva sua consulta SQL aqui (ex.: SELECT * FROM alunos;)..."
        disabled={disabled}
        spellCheck={false}
      />
    </div>
  );
};
