# Trilha Linux (Fase 2)

Especificação do formato e arquitetura dos exercícios da trilha Linux.

## Visão Geral
Na Fase 2, a trilha Linux funcionará com um terminal virtual emulado em TypeScript no navegador (WebAssembly/memfs), operando um sistema de arquivos virtual em memória (`vfs`). Nenhum terminal real ou container será exigido.

## Formato dos Exercícios (content/linux/exercises/*.json)

```json
{
  "id": "linux-01-navegacao-cd-pwd",
  "track": "linux",
  "module": "filesystem",
  "level": 1,
  "title": "Navegação básica com pwd e cd",
  "difficulty": "easy",
  "prerequisites": [],
  "question": "Navegue até o diretório /var/log e verifique o caminho atual com pwd.",
  "filesystemState": {
    "initialDir": "/home/aluno",
    "files": {
      "/var/log/syslog": "log de exemplo",
      "/home/aluno/readme.txt": "bem-vindo ao lab"
    }
  },
  "expectedState": {
    "currentDir": "/var/log"
  },
  "skills": ["cd", "pwd", "navegacao"],
  "hints": [
    "Use cd /var/log para mudar de diretório.",
    "Execute pwd para exibir o diretório de trabalho corrente."
  ],
  "solutions": [
    "cd /var/log && pwd",
    "cd /var/log; pwd"
  ],
  "explanation": "O comando cd (change directory) altera o diretório atual de trabalho no shell, e o comando pwd (print working directory) exibe o caminho absoluto corrente."
}
```

## Motor de Avaliação Futuro (@lab/linux-lab)
- Interpretador de shell simulado em TypeScript.
- Comparação do estado final do VFS (diretório atual, arquivos criados/modificados/apagados, permissões POSIX) e da saída capturada (`stdout`/`stderr`).
