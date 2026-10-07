# 🐘🐧 SQL & Linux Lab

> Plataforma de estudo técnico, prática guiada e validação de comandos, **100% front-end, local e offline**. Sem backend, sem containers no servidor e sem banco de dados externo.

---

## 🌟 Destaques do Projeto

- **🐘 PostgreSQL Real no Navegador**: Executado diretamente via WebAssembly ([PGlite](https://pglite.electric-sql.com)), permitindo queries completas, índices, CTEs e funções nativas sem depender de emuladores mockados.
- **🔒 Sandbox & Isolamento Concorrente**: Allowlist sintática estrita (`SELECT`, `WITH`), transação obrigatória `BEGIN READ ONLY` com `ROLLBACK` incondicional no `finally`, fila assíncrona serializada por instância e cancelamento de queries travadas via Web Worker `terminate()` com auto-recuperação.
- **🎯 Avaliação Pedagógica Semântica**: Três níveis de feedback (`correct` 🟢, `almost` 🟡, `wrong` 🔴), normalização semântica de tipos (ex: `"150.00"` $\equiv$ `150`), ordenação determinística para queries sem `ORDER BY` obrigatório e seleção de melhor correspondência (*best-match*).
- **💾 Persistência Local Multiperfil**: Armazenamento offline via IndexedDB com fallback resiliente para memória em modo anônimo, criação automática do perfil `"Estudante"` e export/import em JSON com validação estrita Zod e algoritmo de *smart merge* (preserva status de conclusão e unifica histórico de tentativas).
- **🎨 Design System Escuro**: Interface moderna desenvolvida em Vanilla CSS puro, layout responsivo com visualização dividida (*split view*), atalhos de teclado (<kbd>Tab</kbd> para 2 espaços, <kbd>Ctrl</kbd>+<kbd>Enter</kbd> para executar) e guia de referência rápida embutido.
- **🐳 Multi-Stage Docker**: Configuração Nginx Alpine pronta para servir os arquivos estáticos com suporte completo a headers `COOP` e `COEP` para WebAssembly.

---

## 📋 Pré-requisitos

- **Node.js**: `v22.12.0` ou superior (consulte o arquivo `.nvmrc`)
- **pnpm**: `v12.9.1` ou superior
- **Docker & Docker Compose** *(opcional)*: para execução em container isolado

---

## 🚀 Como Iniciar Localmente

### 1. Clonar e Instalar Dependências

```bash
# Clone o repositório e acesse a pasta raiz
cd sql-linux-lab

# Instale as dependências de todos os workspaces do monorepo
pnpm install
```

### 2. Executar em Modo de Desenvolvimento

```bash
pnpm dev
```

A aplicação estará disponível em [http://localhost:5173](http://localhost:5173).

---

## 🧪 Comandos e Testes de Qualidade

O monorepo adota regras estritas de qualidade de código (`strict: true` no TypeScript e ESLint sem warnings):

```bash
# Executa a suíte completa de testes unitários e de integração (82 testes no Vitest)
pnpm test

# Executa o typecheck rigoroso em todos os pacotes e na aplicação web
pnpm typecheck

# Executa a validação de regras de código com ESLint
pnpm lint

# Compila todos os pacotes e gera o bundle estático otimizado em apps/web/dist
pnpm build
```

---

## 🐳 Execução via Docker Compose

A plataforma pode ser executada em um container Nginx Alpine pré-configurado com headers de isolamento WebAssembly (`COOP`/`COEP`):

```bash
# Constrói a imagem multi-stage e sobe o container na porta 3000
docker compose up --build
```

Acesse a plataforma em [http://localhost:3000](http://localhost:3000).

Para encerrar a execução:

```bash
docker compose down
```

---

## 📁 Estrutura do Monorepo

```
sql-linux-lab/
├── apps/
│   └── web/                   # Interface do aluno em React 19 + Vite 6
├── packages/
│   ├── shared/                # Tipos, contratos Zod e carregador desacoplado de conteúdo
│   ├── sql-engine/            # Wrapper PGlite WASM, sandbox READ ONLY e Web Worker
│   ├── exercise-engine/       # Avaliador pedagógico e comparador semântico de tabelas
│   ├── progression-engine/    # Gerenciador de perfis locais, IndexedDB e import/export
│   ├── linux-lab/             # [Fase 2] Emulador de terminal Bash e VFS em memória
│   ├── docker-lab/            # [Fase 3] Simulador de comandos Docker CLI
│   └── network-lab/           # [Fase 3] Simulador de rede, curl e portas
├── content/
│   └── sql/
│       ├── datasets/          # Scripts SQL de criação de tabelas e dados de teste
│       └── exercises/         # Exercícios em formato JSON declarativo
├── infrastructure/
│   └── docker/
│       ├── nginx.conf         # Configuração de headers COOP/COEP e SPA fallback
│       └── web.Dockerfile     # Multi-stage build com Node 22 e Nginx Alpine
└── docs/                      # Documentação técnica e guias de contribuição
```

---

## 📚 Documentação Adicional

- 📐 **[docs/architecture.md](file:///c:/Users/lorenzo.cabral/Downloads/Estudos%20PWA/sql-linux-lab/docs/architecture.md)**: Detalhamento da arquitetura técnica, ciclo de vida do PGlite no Web Worker, allowlist de consultas, transações somente leitura e adaptadores de armazenamento.
- 📝 **[docs/content-format.md](file:///c:/Users/lorenzo.cabral/Downloads/Estudos%20PWA/sql-linux-lab/docs/content-format.md)**: Especificação completa do schema JSON de exercícios e tutorial passo a passo para adicionar novos conteúdos educacionais de forma declarativa.

---

## 📄 Licença

Este projeto é desenvolvido para fins educacionais e de estudo técnico. Distribuído sob a licença MIT.
