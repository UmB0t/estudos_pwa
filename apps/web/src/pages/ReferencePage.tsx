import React from 'react';

export const ReferencePage: React.FC = () => {
  return (
    <div className="ref-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Material de Consulta Rápida (SQL &amp; PostgreSQL)
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Guia de referência prático com as principais sintaxes, operadores e funções do PostgreSQL.
        </p>
      </div>

      {/* 1. Consultas Básicas */}
      <section className="ref-section">
        <h2>1. Consultas Básicas</h2>

        <div className="command-item">
          <div className="command-title">SELECT col1, col2</div>
          <div className="command-desc">Projeta apenas colunas específicas de uma tabela.</div>
          <div className="code-snippet">SELECT nome, idade FROM alunos;</div>
        </div>

        <div className="command-item">
          <div className="command-title">SELECT *</div>
          <div className="command-desc">Retorna todas as colunas existentes na tabela.</div>
          <div className="code-snippet">SELECT * FROM alunos;</div>
        </div>

        <div className="command-item">
          <div className="command-title">DISTINCT</div>
          <div className="command-desc">Elimina linhas com valores duplicados no resultado.</div>
          <div className="code-snippet">SELECT DISTINCT cidade FROM alunos;</div>
        </div>

        <div className="command-item">
          <div className="command-title">Alias com AS</div>
          <div className="command-desc">Renomeia uma coluna ou tabela no conjunto de resultados.</div>
          <div className="code-snippet">SELECT nome AS estudante, idade AS anos FROM alunos;</div>
        </div>
      </section>

      {/* 2. Filtros */}
      <section className="ref-section">
        <h2>2. Filtros e Operadores Condicionais</h2>

        <div className="command-item">
          <div className="command-title">WHERE</div>
          <div className="command-desc">Filtra linhas com base em condições lógicas booleanas.</div>
          <div className="code-snippet">SELECT * FROM alunos WHERE idade &gt;= 18;</div>
        </div>

        <div className="command-item">
          <div className="command-title">AND / OR</div>
          <div className="command-desc">Combina múltiplas condições lógicas (E / OU).</div>
          <div className="code-snippet">
            SELECT * FROM alunos WHERE curso = 'Engenharia de Software' AND cidade = 'São Paulo';
          </div>
        </div>

        <div className="command-item">
          <div className="command-title">IN / NOT IN</div>
          <div className="command-desc">Verifica se um valor pertence ou não a uma lista de valores.</div>
          <div className="code-snippet">
            SELECT * FROM alunos WHERE cidade IN ('São Paulo', 'Curitiba', 'Rio de Janeiro');
          </div>
        </div>

        <div className="command-item">
          <div className="command-title">BETWEEN (Inclusivo)</div>
          <div className="command-desc">Verifica se um valor está dentro de uma faixa (inclusivo).</div>
          <div className="code-snippet">SELECT * FROM alunos WHERE idade BETWEEN 18 AND 22;</div>
        </div>

        <div className="command-item">
          <div className="command-title">LIKE / ILIKE</div>
          <div className="command-desc">
            Busca textual por padrão com curingas (% e _). LIKE é case-sensitive; ILIKE (Postgres) é case-insensitive.
          </div>
          <div className="code-snippet">
            SELECT * FROM alunos WHERE nome ILIKE 'ana%';
          </div>
        </div>

        <div className="command-item">
          <div className="command-title">IS NULL / IS NOT NULL</div>
          <div className="command-desc">Testa se um valor é nulo ou não nulo (não use = NULL).</div>
          <div className="code-snippet">SELECT * FROM alunos WHERE cidade IS NULL;</div>
        </div>
      </section>

      {/* 3. Ordenação e Paginação */}
      <section className="ref-section">
        <h2>3. Ordenação e Paginação</h2>

        <div className="command-item">
          <div className="command-title">ORDER BY (ASC / DESC)</div>
          <div className="command-desc">Ordena o resultado em ordem crescente (ASC, padrão) ou decrescente (DESC).</div>
          <div className="code-snippet">SELECT * FROM alunos ORDER BY idade DESC, nome ASC;</div>
        </div>

        <div className="command-item">
          <div className="command-title">LIMIT e OFFSET</div>
          <div className="command-desc">Limita o número máximo de registros retornados e pula um número de linhas (paginação).</div>
          <div className="code-snippet">SELECT * FROM alunos ORDER BY id LIMIT 5 OFFSET 10;</div>
        </div>
      </section>

      {/* 4. Agregações */}
      <section className="ref-section">
        <h2>4. Agregações</h2>

        <div className="command-item">
          <div className="command-title">COUNT(*), COUNT(coluna), COUNT(DISTINCT coluna)</div>
          <div className="command-desc">
            Conta o total de linhas. COUNT(coluna) ignora valores NULL; COUNT(DISTINCT coluna) conta valores únicos.
          </div>
          <div className="code-snippet">
            SELECT COUNT(*) AS total, COUNT(cidade) AS cidades_preenchidas, COUNT(DISTINCT cidade) AS cidades_unicas FROM alunos;
          </div>
        </div>

        <div className="command-item">
          <div className="command-title">SUM, AVG, MIN, MAX</div>
          <div className="command-desc">Calcula soma, média aritmética, valor mínimo e valor máximo de colunas numéricas.</div>
          <div className="code-snippet">
            SELECT AVG(idade) AS media_idade, MIN(idade) AS menor_idade, MAX(idade) AS maior_idade FROM alunos;
          </div>
        </div>
      </section>

      {/* 5. Agrupamento */}
      <section className="ref-section">
        <h2>5. Agrupamento</h2>

        <div className="command-item">
          <div className="command-title">GROUP BY</div>
          <div className="command-desc">Agrupa linhas que possuem os mesmos valores nas colunas especificadas para cálculo de agregados.</div>
          <div className="code-snippet">SELECT curso, COUNT(*) AS total_alunos FROM alunos GROUP BY curso;</div>
        </div>

        <div className="command-item">
          <div className="command-title">HAVING</div>
          <div className="command-desc">Filtra grupos após a agregação (diferente do WHERE, que filtra linhas antes da agregação).</div>
          <div className="code-snippet">
            SELECT curso, COUNT(*) AS total FROM alunos GROUP BY curso HAVING COUNT(*) &gt;= 3;
          </div>
        </div>
      </section>

      {/* 6. Conversão de Tipos (PostgreSQL) */}
      <section className="ref-section">
        <h2>6. Conversão de Tipos (PostgreSQL)</h2>

        <div className="command-item">
          <div className="command-title">Operador :: e CAST</div>
          <div className="command-desc">Converte o tipo de um dado no PostgreSQL. O operador :: é a sintaxe preferencial nativa.</div>
          <div className="code-snippet">
            SELECT '42'::int, 150::numeric(10,2), '2026-10-07'::date, 'true'::boolean;
          </div>
        </div>

        <div className="command-item">
          <div className="command-title">Tipos comuns</div>
          <div className="command-desc">
            ::text, ::int, ::numeric(10,2), ::date, ::timestamp, ::boolean, ::uuid, ::jsonb
          </div>
          <div className="code-snippet">
            {"SELECT CAST('{\"chave\": \"valor\"}' AS jsonb) ->> 'chave';"}
          </div>
        </div>
      </section>

      {/* 7. Nulos e Lógica Condicional */}
      <section className="ref-section">
        <h2>7. Nulos e Lógica Condicional</h2>

        <div className="command-item">
          <div className="command-title">COALESCE(coluna, padrao)</div>
          <div className="command-desc">Retorna o primeiro valor não nulo da lista de argumentos.</div>
          <div className="code-snippet">SELECT nome, COALESCE(cidade, 'Não informada') AS cidade FROM alunos;</div>
        </div>

        <div className="command-item">
          <div className="command-title">CASE WHEN ... THEN ... ELSE ... END</div>
          <div className="command-desc">Estrutura condicional (IF-THEN-ELSE) para transformar valores durante a consulta.</div>
          <div className="code-snippet">
            SELECT nome, idade, CASE WHEN idade &gt;= 18 THEN 'Maior de idade' ELSE 'Menor de idade' END AS status_idade FROM alunos;
          </div>
        </div>
      </section>
    </div>
  );
};
