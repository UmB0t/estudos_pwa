# Guia de Especificação e Formato de Conteúdo

Este guia especifica o schema dos exercícios, o padrão de datasets e o passo a passo para adicionar novos conteúdos educacionais ao **SQL & Linux Lab** de forma 100% declarativa, **sem alterar o código do frontend**.

---

## 1. Princípio do Desacoplamento de Conteúdo

Todo o conteúdo educacional da plataforma reside exclusivamente no diretório `content/`:

```
content/
└── sql/
    ├── datasets/
    │   └── alunos.sql          # Esquema e dados de exemplo
    └── exercises/
        ├── 01-select-todos.json
        ├── 02-select-colunas.json
        └── ...
```

O carregamento é automático: a aplicação utiliza `import.meta.glob` do Vite integrado com o validador `ExerciseSchema` do `@lab/shared`. Qualquer novo arquivo JSON adicionado à pasta `exercises/` é automaticamente validado, catalogado e renderizado na interface.

---

## 2. Especificação do Schema de Exercício (JSON)

Cada exercício é um arquivo `.json` contendo os seguintes campos:

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Sim | Identificador único estável (ex: `"sql-09"`). |
| `slug` | `string` | Sim | Identificador legível amigável para URLs (ex: `"where-maior-idade"`). |
| `title` | `string` | Sim | Título curto e objetivo do exercício. |
| `track` | `"sql" \| "linux" \| "docker" \| "networks"` | Sim | Trilha tecnológica à qual pertence. |
| `module` | `string` | Sim | Identificador do módulo temático (ex: `"select"`, `"alias"`, `"where"`). |
| `level` | `number` (inteiro $\ge 1$) | Sim | Grau de profundidade conceitual. |
| `difficulty` | `"iniciante" \| "intermediario" \| "avancado"` | Sim | Nível de dificuldade para exibição de badge. |
| `skills` | `string[]` | Sim | Lista de tags das habilidades praticadas (ex: `["where", "operadores"]`). |
| `question` | `string` | Sim | Enunciado completo da tarefa que o aluno deve resolver. |
| `hints` | `string[]` | Sim | Lista ordenada de dicas pedagógicas reveladas progressivamente. |
| `dataset` | `string \| null` | Não | Nome do dataset a carregar (sem `.sql`, ex: `"alunos"`). |
| `initSql` | `string \| null` | Não | SQL adicional customizado executado antes do exercício (se houver). |
| `solutions` | `string[]` | Sim | Pelo menos uma consulta SQL válida aceita como gabarito. |
| `explanation` | `string` | Sim | Explicação didática exibida após o acerto ou revelação do gabarito. |
| `orderMatters` | `boolean` | Sim | `true` se a ordem das linhas for mandatória (exige `ORDER BY`), `false` caso contrário. |

---

## 3. Especificação de Datasets (`.sql`)

Os datasets ficam em `content/sql/datasets/<nome>.sql`. Eles devem ser autocontidos:

```sql
-- Exemplo: content/sql/datasets/pedidos.sql
DROP TABLE IF EXISTS pedidos;

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente VARCHAR(100) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    data_pedido DATE NOT NULL
);

INSERT INTO pedidos (cliente, valor, status, data_pedido) VALUES
('Ana Clara', 250.00, 'pago', '2026-01-10'),
('Bruno Dias', 89.90, 'pendente', '2026-01-12'),
('Carlos Lima', 1200.50, 'pago', '2026-01-15');
```

### Boas Práticas para Datasets:
- **Tamanho moderado**: Recomenda-se entre 8 e 20 registros. O suficiente para demonstrar filtros, nulos e ordenações sem sobrecarregar a memória do navegador.
- **Diversidade de dados**: Inclua campos com valores repetidos (para praticar `DISTINCT` ou `GROUP BY`), valores `NULL` e datas com diferentes formatos.

---

## 4. Passo a Passo: Adicionando um Novo Exercício

### Passo 1: Criar o arquivo JSON
Crie um novo arquivo em `content/sql/exercises/`, por exemplo: `content/sql/exercises/09-where-in.json`.

```json
{
  "id": "sql-09",
  "slug": "where-filtro-in",
  "title": "Filtrando por Múltiplas Cidades com IN",
  "track": "sql",
  "module": "where",
  "level": 3,
  "difficulty": "iniciante",
  "skills": ["where", "operador-in", "filtros"],
  "question": "Selecione o nome e a cidade de todos os alunos que residem em 'São Paulo' ou 'Curitiba'.",
  "hints": [
    "Você pode usar o operador IN seguido de parênteses com os valores desejados.",
    "A sintaxe geral é: WHERE coluna IN ('Valor 1', 'Valor 2')."
  ],
  "dataset": "alunos",
  "initSql": null,
  "solutions": [
    "SELECT nome, cidade FROM alunos WHERE cidade IN ('São Paulo', 'Curitiba');",
    "SELECT nome, cidade FROM alunos WHERE cidade = 'São Paulo' OR cidade = 'Curitiba';"
  ],
  "explanation": "O operador IN verifica se o valor da coluna pertence a uma lista de valores literais, simplificando condições que exigiriam múltiplos blocos de OR.",
  "orderMatters": false
}
```

> **Dica**: No campo `solutions`, inclua variações sintáticas válidas (como `IN` e múltiplos `OR`). O motor avaliará pela correspondência de melhor resultado (*best-match*).

### Passo 2: Validar o Conteúdo Automaticamente
No terminal, execute:

```bash
pnpm test
```

O teste `packages/shared/src/content-loader.test.ts` valida dinamicamente todos os arquivos da pasta `content/` contra o schema Zod. Se houver qualquer campo faltante ou tipo divergente, o teste informará exatamente o arquivo e o erro de validação.

### Passo 3: Visualizar na Aplicação
Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

Acesse a página inicial do laboratório. O novo exercício já aparecerá no card do módulo correspondente, pronto para execução e registro de progresso!
