import { describe, expect, it } from 'vitest';
import type { Exercise } from '@lab/shared';
import { SqlEvaluator } from './sql-evaluator';

describe('SqlEvaluator (Integração com PGlite)', () => {
  const evaluator = new SqlEvaluator();

  const datasetAlunos = `
    CREATE TABLE alunos (
      id INT PRIMARY KEY,
      nome TEXT NOT NULL,
      idade INT NOT NULL,
      cidade TEXT,
      mensalidade NUMERIC(10, 2)
    );
    INSERT INTO alunos VALUES
      (1, 'Ana Silva', 20, 'São Paulo', 150.00),
      (2, 'Bruno Costa', 22, 'Rio de Janeiro', 200.50),
      (3, 'Carlos Lima', 19, NULL, 180.00),
      (4, 'Daniela Souza', 25, 'Belo Horizonte', 150.00);
  `;

  const baseExercise: Exercise = {
    id: 'sql-test-01',
    track: 'sql',
    module: 'select',
    level: 1,
    title: 'Consultar alunos',
    difficulty: 'easy',
    prerequisites: [],
    question: 'Selecione o nome e a idade de todos os alunos.',
    dataset: 'alunos',
    orderMatters: false,
    skills: ['select'],
    hints: [],
    solutions: ['SELECT nome, idade FROM alunos;'],
  };

  // 1. Whitespace e formatação diferente (select nome,idade\nfrom alunos ≡ SELECT nome, idade FROM alunos;)
  it('1. deve aceitar variações de quebra de linha, espaços e pontuação como correct', async () => {
    const studentSql = 'select nome,idade\nfrom alunos';
    const res = await evaluator.evaluate(
      { exercise: baseExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('correct');
    expect(res.studentResult).toBeDefined();
    expect(res.studentResult?.columns).toEqual(['nome', 'idade']);
  });

  // 2. Coluna extra -> almost com mensagem explicativa
  it('2. deve retornar almost quando o aluno retornar coluna extra não solicitada', async () => {
    const studentSql = 'SELECT nome, idade, cidade FROM alunos;';
    const res = await evaluator.evaluate(
      { exercise: baseExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('almost');
    expect(res.message).toContain('`cidade`');
    expect(res.studentResult?.columns).toEqual(['nome', 'idade', 'cidade']);
  });

  // 3. Colunas em ordem trocada -> almost
  it('3. deve retornar almost quando as colunas estiverem em ordem diferente', async () => {
    const studentSql = 'SELECT idade, nome FROM alunos;';
    const res = await evaluator.evaluate(
      { exercise: baseExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('almost');
    expect(res.message).toContain('ordem diferente');
  });

  // 4. Alias diferente -> almost
  it('4. deve retornar almost quando o alias da coluna divergir do esperado', async () => {
    const aliasExercise: Exercise = {
      ...baseExercise,
      solutions: ['SELECT nome AS estudante, idade FROM alunos;'],
    };
    const studentSql = 'SELECT nome AS n, idade FROM alunos;';
    const res = await evaluator.evaluate(
      { exercise: aliasExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('almost');
    expect(res.message).toContain('`n`');
    expect(res.message).toContain('`estudante`');
  });

  // 5. ORDER BY ausente quando orderMatters: true -> almost
  it('5. deve retornar almost quando orderMatters: true e o ORDER BY estiver ausente', async () => {
    const orderedExercise: Exercise = {
      ...baseExercise,
      orderMatters: true,
      solutions: ['SELECT nome, idade FROM alunos ORDER BY idade DESC;'],
    };
    // Aluno retorna na ordem natural do banco (não ordenado por idade DESC)
    const studentSql = 'SELECT nome, idade FROM alunos ORDER BY id ASC;';
    const res = await evaluator.evaluate(
      { exercise: orderedExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('almost');
    expect(res.message).toContain('ordenação das linhas não corresponde');
  });

  // 6. ORDER BY ausente quando orderMatters: false -> correct
  it('6. deve retornar correct quando orderMatters: false mesmo com ordenação diferente', async () => {
    const unorderedExercise: Exercise = {
      ...baseExercise,
      orderMatters: false,
      solutions: ['SELECT nome, idade FROM alunos ORDER BY idade ASC;'],
    };
    const studentSql = 'SELECT nome, idade FROM alunos ORDER BY id DESC;';
    const res = await evaluator.evaluate(
      { exercise: unorderedExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('correct');
  });

  // 7. Filtro WHERE errado -> wrong
  it('7. deve retornar wrong quando o filtro WHERE retornar linhas incorretas', async () => {
    const whereExercise: Exercise = {
      ...baseExercise,
      solutions: ['SELECT nome, idade FROM alunos WHERE idade >= 20;'],
    };
    // Aluno filtra com > 20 em vez de >= 20 (omite quem tem 20 anos)
    const studentSql = 'SELECT nome, idade FROM alunos WHERE idade > 20;';
    const res = await evaluator.evaluate(
      { exercise: whereExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('wrong');
    expect(res.studentResult).toBeDefined();
    expect(res.studentResult?.rows.length).toBe(2);
  });

  // 8. Erro de sintaxe -> wrong com mensagem amigável
  it('8. deve retornar wrong com mensagem amigável em caso de erro de sintaxe', async () => {
    const studentSql = 'SELECT nome, idade FORM alunos;';
    const res = await evaluator.evaluate(
      { exercise: baseExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('wrong');
    expect(res.message).toContain('Erro de sintaxe próximo a "alunos"');
  });

  // 8b. Erro de sintaxe em query incompleta (ex: SELECT * FROM)
  it('8b. deve capturar erro de sintaxe em query incompleta (ex: SELECT * FROM)', async () => {
    const studentSql = 'SELECT * FROM';
    const res = await evaluator.evaluate(
      { exercise: baseExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('wrong');
    expect(res.message).toContain('Erro de sintaxe');
    expect(res.error).toBeDefined();
  });

  // 8c. Query correta retorna todas as linhas e status correct
  it('8c. deve retornar todas as linhas em SELECT * FROM alunos e status correct', async () => {
    const allAlunosExercise: Exercise = {
      ...baseExercise,
      solutions: ['SELECT * FROM alunos;'],
    };
    const studentSql = 'SELECT * FROM alunos;';
    const res = await evaluator.evaluate(
      { exercise: allAlunosExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('correct');
    expect(res.studentResult).toBeDefined();
    expect(res.studentResult?.rows.length).toBe(4);
  });

  // 9. Tentativa de DROP TABLE/INSERT -> bloqueada (wrong)
  it('9. deve bloquear tentativas de mutação DDL/DML e retornar wrong', async () => {
    const dropSql = 'DROP TABLE alunos;';
    const resDrop = await evaluator.evaluate(
      { exercise: baseExercise, datasetSql: datasetAlunos },
      dropSql,
    );
    expect(resDrop.status).toBe('wrong');
    expect(resDrop.message).toContain('Apenas consultas de leitura iniciadas com SELECT ou WITH');

    const insertSql = "INSERT INTO alunos VALUES (5, 'Eva', 21, 'Recife', 100);";
    const resInsert = await evaluator.evaluate(
      { exercise: baseExercise, datasetSql: datasetAlunos },
      insertSql,
    );
    expect(resInsert.status).toBe('wrong');
  });

  // 10. Múltiplas instruções na mesma query -> rejeitada (wrong)
  it('10. deve rejeitar múltiplas instruções na mesma chamada', async () => {
    const multiSql = 'SELECT 1; SELECT 2;';
    const res = await evaluator.evaluate(
      { exercise: baseExercise, datasetSql: datasetAlunos },
      multiSql,
    );

    expect(res.status).toBe('wrong');
    expect(res.message).toBe('Apenas uma única instrução SQL pode ser executada por vez.');
  });

  // 11. Múltiplas soluções alternativas (best-match escolhe o melhor resultado)
  it('11. deve selecionar a melhor correspondência entre múltiplas soluções válidas', async () => {
    const multiSolutionExercise: Exercise = {
      ...baseExercise,
      solutions: [
        'SELECT nome, idade FROM alunos WHERE cidade IS NOT NULL;',
        'SELECT nome, idade FROM alunos WHERE cidade IS NULL;',
      ],
    };
    // Aluno atende à segunda solução
    const studentSql = 'SELECT nome, idade FROM alunos WHERE cidade IS NULL;';
    const res = await evaluator.evaluate(
      { exercise: multiSolutionExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('correct');
  });

  // 12. Exercício A não afeta exercício B (isolamento)
  it('12. deve garantir que o exercício A não afete o ambiente do exercício B', async () => {
    const exerciseA: Exercise = {
      ...baseExercise,
      setup: 'CREATE TABLE tab_ex_a (id INT);',
      solutions: ['SELECT * FROM tab_ex_a;'],
    };
    const exerciseB: Exercise = {
      ...baseExercise,
      solutions: ['SELECT nome FROM alunos;'],
    };

    // Avalia exercício A
    const resA = await evaluator.evaluate(
      { exercise: exerciseA, datasetSql: datasetAlunos },
      'SELECT * FROM tab_ex_a;',
    );
    expect(resA.status).toBe('correct');

    // No exercício B, tab_ex_a não existe
    const resB = await evaluator.evaluate(
      { exercise: exerciseB, datasetSql: datasetAlunos },
      'SELECT * FROM tab_ex_a;',
    );
    expect(resB.status).toBe('wrong');
    expect(resB.message).toContain('A tabela "tab_ex_a" não foi encontrada no banco de dados.');
  });

  // 13. Equivalência numérica (ex: 150 vs "150.00")
  it('13. deve considerar equivalência numérica entre formato decimal e inteiro', async () => {
    const numExercise: Exercise = {
      ...baseExercise,
      solutions: ['SELECT mensalidade FROM alunos WHERE id = 1;'], // 150.00
    };
    // Aluno converte para inteiro ou usa cálculo equivalente
    const studentSql = 'SELECT 150 AS mensalidade;';
    const res = await evaluator.evaluate(
      { exercise: numExercise, datasetSql: datasetAlunos },
      studentSql,
    );

    expect(res.status).toBe('correct');
  });
});
