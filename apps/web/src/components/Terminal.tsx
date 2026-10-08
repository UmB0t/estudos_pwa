import React, { useState, useEffect, useRef } from 'react';
import type { ExerciseTrack } from '@lab/shared';
import { LinuxSession } from '@lab/linux-lab';
import { DockerSession } from '@lab/docker-lab';
import { NetworkSession } from '@lab/network-lab';

export interface TerminalProps {
  track: ExerciseTrack;
  initialSetup?: string;
  onCommandRun?: (command: string, stdout: string, stderr: string) => void;
  onCodeChange?: (code: string) => void;
  currentCode?: string;
  disabled?: boolean;
}

interface HistoryEntry {
  id: string;
  prompt: string;
  command: string;
  stdout: string;
  stderr: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  track,
  initialSetup,
  onCommandRun,
  onCodeChange,
  currentCode = '',
  disabled = false,
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [inputVal, setInputVal] = useState(currentCode);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [commandList, setCommandList] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('aluno@vetor:~$ ');

  // Referência às instâncias de sessão simuladas
  const sessionRef = useRef<LinuxSession | DockerSession | NetworkSession | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Inicializa a sessão conforme o track
  useEffect(() => {
    let newSession: LinuxSession | DockerSession | NetworkSession;

    if (track === 'linux') {
      const s = new LinuxSession();
      if (initialSetup) {
        for (const line of initialSetup.split('\n')) {
          if (line.trim()) s.execute(line.trim());
        }
      }
      newSession = s;
      setPrompt(s.getPrompt());
    } else if (track === 'docker') {
      const s = new DockerSession();
      if (initialSetup) {
        for (const line of initialSetup.split('\n')) {
          if (line.trim()) s.execute(line.trim());
        }
      }
      newSession = s;
      setPrompt('docker$ ');
    } else {
      const s = new NetworkSession();
      newSession = s;
      setPrompt('aluno@vetor:~$ ');
    }

    sessionRef.current = newSession;
    setHistory([]);
    setCommandList([]);
    setHistoryIndex(null);
  }, [track, initialSetup]);

  // Sincroniza se o código externo mudar (ex: restauração de código)
  useEffect(() => {
    if (currentCode && currentCode !== inputVal) {
      setInputVal(currentCode);
    }
  }, [currentCode]);

  // Rola até o final sempre que houver nova saída
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    if (trimmed === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    }

    const session = sessionRef.current;
    let stdout = '';
    let stderr = '';
    const currentPrompt = prompt;

    if (session) {
      if (session instanceof LinuxSession) {
        const res = session.execute(trimmed);
        stdout = res.stdout;
        stderr = res.stderr;
        setPrompt(session.getPrompt());
      } else if (session instanceof DockerSession) {
        const res = session.execute(trimmed);
        stdout = res.stdout;
        stderr = res.stderr;
      } else if (session instanceof NetworkSession) {
        const res = session.execute(trimmed);
        stdout = res.stdout;
        stderr = res.stderr;
      }
    }

    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      prompt: currentPrompt,
      command: trimmed,
      stdout,
      stderr,
    };

    setHistory((prev) => [...prev, newEntry]);
    setCommandList((prev) => [...prev, trimmed]);
    setHistoryIndex(null);
    setInputVal('');

    if (onCodeChange) {
      onCodeChange(trimmed);
    }

    if (onCommandRun) {
      onCommandRun(trimmed, stdout, stderr);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(inputVal);
      return;
    }

    // Histórico para cima (↑)
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandList.length === 0) return;
      const nextIdx = historyIndex === null ? commandList.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      const chosen = commandList[nextIdx];
      if (chosen !== undefined) {
        setInputVal(chosen);
        if (onCodeChange) onCodeChange(chosen);
      }
      return;
    }

    // Histórico para baixo (↓)
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      if (historyIndex < commandList.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        const chosen = commandList[nextIdx];
        if (chosen !== undefined) {
          setInputVal(chosen);
          if (onCodeChange) onCodeChange(chosen);
        }
      } else {
        setHistoryIndex(null);
        setInputVal('');
        if (onCodeChange) onCodeChange('');
      }
      return;
    }

    // Autocompletar com Tab
    if (e.key === 'Tab') {
      e.preventDefault();
      const session = sessionRef.current;
      if (session instanceof LinuxSession) {
        const auto = session.autocomplete(inputVal);
        if (auto.replacement && auto.replacement !== inputVal) {
          setInputVal(auto.replacement);
          if (onCodeChange) onCodeChange(auto.replacement);
        } else if (auto.suggestions.length > 1) {
          setHistory((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              prompt,
              command: inputVal,
              stdout: auto.suggestions.join('  ') + '\n',
              stderr: '',
            },
          ]);
        }
      } else if (session instanceof DockerSession) {
        const subcommands = ['ps', 'images', 'run', 'stop', 'rm', 'logs', 'help'];
        const parts = inputVal.trim().split(' ');
        const subArg = parts[1];
        if (parts[0] === 'docker' && parts.length === 2 && subArg !== undefined) {
          const match = subcommands.filter((s) => s.startsWith(subArg));
          if (match.length === 1 && match[0]) {
            const completed = `docker ${match[0]} `;
            setInputVal(completed);
            if (onCodeChange) onCodeChange(completed);
          }
        }
      }
    }
  };

  const getTitle = () => {
    switch (track) {
      case 'linux':
        return 'bash (Vetor Linux Virtual VFS)';
      case 'docker':
        return 'docker CLI (Simulador de Containers)';
      case 'networks':
        return 'bash (Diagnóstico de Redes)';
      default:
        return 'terminal';
    }
  };

  return (
    <div className="terminal-container" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <div className="terminal-title">
          <span>{getTitle()}</span>
        </div>
        <div className="terminal-hint">
          <kbd className="kbd-key">Tab</kbd> Autocompletar • <kbd className="kbd-key">↑/↓</kbd> Histórico
        </div>
      </div>

      <div className="terminal-interactive-body">
        {history.length === 0 && (
          <div className="terminal-welcome">
            <span className="welcome-comment"># Digite seus comandos ou use o atalho para testar</span>
            <br />
            <span className="welcome-comment"># Pressione &lt;Tab&gt; para autocompletar nomes de arquivos e comandos</span>
          </div>
        )}

        {history.map((item) => (
          <div key={item.id} className="terminal-log-item">
            <div className="terminal-line-cmd">
              <span className="terminal-prompt">{item.prompt}</span>
              <span className="terminal-cmd">{item.command}</span>
            </div>
            {item.stdout && <pre className="terminal-output stdout">{item.stdout}</pre>}
            {item.stderr && <pre className="terminal-output stderr">{item.stderr}</pre>}
          </div>
        ))}

        <div className="terminal-active-row">
          <span className="terminal-prompt">{prompt}</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-active-input"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              if (onCodeChange) onCodeChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            placeholder="Digite o comando aqui..."
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
