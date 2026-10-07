import type { SqlQueryResult } from '@lab/sql-engine';

export interface ComparisonOutcome {
  status: 'correct' | 'almost' | 'wrong';
  message: string;
  penaltyScore: number; // Menor score = melhor correspondência (para desempate de almost/wrong)
}

/**
 * Verifica equivalência semântica entre valores (suporta números em formato string, nulls, etc.)
 */
export function areValuesEquivalent(valA: unknown, valB: unknown): boolean {
  if (valA === null || valA === undefined) {
    return valB === null || valB === undefined;
  }
  if (valB === null || valB === undefined) {
    return false;
  }

  // Se ambos são booleanos
  if (typeof valA === 'boolean' || typeof valB === 'boolean') {
    return Boolean(valA) === Boolean(valB);
  }

  // Verifica se ambos representam números finitos (ex.: 150 e "150.00" ou "150")
  const isNumericA =
    typeof valA === 'number' || (typeof valA === 'string' && valA.trim() !== '' && !isNaN(Number(valA)));
  const isNumericB =
    typeof valB === 'number' || (typeof valB === 'string' && valB.trim() !== '' && !isNaN(Number(valB)));

  if (isNumericA && isNumericB) {
    const numA = Number(valA);
    const numB = Number(valB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return Math.abs(numA - numB) < 1e-9;
    }
  }

  // Se são datas
  if (valA instanceof Date && valB instanceof Date) {
    return valA.getTime() === valB.getTime();
  }

  // Comparação padrão como texto
  return String(valA) === String(valB);
}

/**
 * Gera representação canônica determinística para um valor individual.
 */
export function canonicalValueString(val: unknown): string {
  if (val === null || val === undefined) {
    return 'null';
  }
  const isNumeric =
    typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)));
  if (isNumeric) {
    const num = Number(val);
    if (!isNaN(num)) {
      return `num:${num.toFixed(6)}`;
    }
  }
  if (typeof val === 'boolean') {
    return `bool:${Boolean(val)}`;
  }
  return `str:${String(val)}`;
}

/**
 * Gera chave canônica determinística para uma linha inteira.
 */
export function canonicalRowKey(row: unknown[]): string {
  return row.map(canonicalValueString).join('||');
}

/**
 * Verifica se duas linhas são equivalentes campo a campo.
 */
function areRowsEquivalent(rowA: unknown[], rowB: unknown[]): boolean {
  if (rowA.length !== rowB.length) return false;
  for (let i = 0; i < rowA.length; i++) {
    if (!areValuesEquivalent(rowA[i], rowB[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Compara semanticamente o resultado do aluno com a solução de referência.
 */
export function compareResultSets(
  student: SqlQueryResult,
  solution: SqlQueryResult,
  orderMatters: boolean,
): ComparisonOutcome {
  const studentCols = student.columns;
  const solutionCols = solution.columns;

  const studentLowerCols = studentCols.map((c) => c.toLowerCase());
  const solutionLowerCols = solutionCols.map((c) => c.toLowerCase());

  const sameColsStrict =
    studentCols.length === solutionCols.length &&
    studentCols.every((col, i) => col.toLowerCase() === solutionCols[i]?.toLowerCase());

  const studentRows = student.rows;
  const solutionRows = solution.rows;

  // 1. Cenário: Exatamente as mesmas colunas (nomes e ordem)
  if (sameColsStrict) {
    // Verifica se as linhas batem na ordem exata em que vieram
    const exactOrderMatches =
      studentRows.length === solutionRows.length &&
      studentRows.every((sRow, i) => areRowsEquivalent(sRow, solutionRows[i] ?? []));

    if (exactOrderMatches) {
      return {
        status: 'correct',
        message: 'Parabéns! Sua consulta retornou exatamente os dados esperados.',
        penaltyScore: 0,
      };
    }

    // Se a ordem não bateu estritamente, mas o número de linhas é igual,
    // verifica se o conjunto de dados é idêntico usando ordenação canônica determinística:
    if (studentRows.length === solutionRows.length) {
      const sortedStudent = [...studentRows].sort((a, b) =>
        canonicalRowKey(a).localeCompare(canonicalRowKey(b)),
      );
      const sortedSolution = [...solutionRows].sort((a, b) =>
        canonicalRowKey(a).localeCompare(canonicalRowKey(b)),
      );

      const contentMatches = sortedStudent.every((sRow, i) =>
        areRowsEquivalent(sRow, sortedSolution[i] ?? []),
      );

      if (contentMatches) {
        if (!orderMatters) {
          // Quando a ordem não importa, o conteúdo idêntico é considerado correto!
          return {
            status: 'correct',
            message: 'Parabéns! Sua consulta retornou os dados esperados.',
            penaltyScore: 0,
          };
        } else {
          // Quando a ordem importa, gera ALMOST explicando a ordenação
          return {
            status: 'almost',
            message:
              'Os dados retornados estão corretos, mas a ordenação das linhas não corresponde à pedida.',
            penaltyScore: 10,
          };
        }
      }
    }
  }

  // 2. Cenário: Mesmas colunas presentes, mas em ordem diferente
  const sameColsDifferentOrder =
    studentCols.length === solutionCols.length &&
    solutionLowerCols.every((sc) => studentLowerCols.includes(sc));

  if (sameColsDifferentOrder && !sameColsStrict) {
    // Mapeia os índices das colunas do aluno para a ordem da solução
    const colMapping = solutionLowerCols.map((sc) => studentLowerCols.indexOf(sc));
    const reorderedStudentRows = studentRows.map((row) => colMapping.map((idx) => row[idx]));

    const sortedReordered = [...reorderedStudentRows].sort((a, b) =>
      canonicalRowKey(a).localeCompare(canonicalRowKey(b)),
    );
    const sortedSolution = [...solutionRows].sort((a, b) =>
      canonicalRowKey(a).localeCompare(canonicalRowKey(b)),
    );

    const rowsMatch =
      sortedReordered.length === sortedSolution.length &&
      sortedReordered.every((rRow, i) => areRowsEquivalent(rRow, sortedSolution[i] ?? []));

    if (rowsMatch) {
      return {
        status: 'almost',
        message: 'Você retornou as colunas corretas, mas elas estão em uma ordem diferente da pedida.',
        penaltyScore: 15,
      };
    }
  }

  // 3. Cenário: Aluno retornou coluna extra
  const extraCols = studentCols.filter((sc) => !solutionLowerCols.includes(sc.toLowerCase()));
  const missingCols = solutionCols.filter((sc) => !studentLowerCols.includes(sc.toLowerCase()));

  if (extraCols.length > 0 && missingCols.length === 0) {
    // Aluno incluiu todas as colunas pedidas + uma ou mais colunas extras
    const matchingIndices = solutionLowerCols.map((sc) => studentLowerCols.indexOf(sc));
    const projectedStudentRows = studentRows.map((row) => matchingIndices.map((idx) => row[idx]));

    const sortedProjected = [...projectedStudentRows].sort((a, b) =>
      canonicalRowKey(a).localeCompare(canonicalRowKey(b)),
    );
    const sortedSolution = [...solutionRows].sort((a, b) =>
      canonicalRowKey(a).localeCompare(canonicalRowKey(b)),
    );

    const dataMatches =
      sortedProjected.length === sortedSolution.length &&
      sortedProjected.every((pRow, i) => areRowsEquivalent(pRow, sortedSolution[i] ?? []));

    if (dataMatches) {
      const extraList = extraCols.map((c) => `\`${c}\``).join(', ');
      return {
        status: 'almost',
        message: `Você retornou a coluna ${extraList}, que não foi pedida.`,
        penaltyScore: 20,
      };
    }
  }

  // 4. Cenário: Mesma quantidade de colunas e dados batem, mas o alias da coluna é diferente
  if (studentCols.length === solutionCols.length && studentRows.length === solutionRows.length) {
    const sortedStudent = [...studentRows].sort((a, b) =>
      canonicalRowKey(a).localeCompare(canonicalRowKey(b)),
    );
    const sortedSolution = [...solutionRows].sort((a, b) =>
      canonicalRowKey(a).localeCompare(canonicalRowKey(b)),
    );

    const dataMatches = sortedStudent.every((sRow, i) =>
      areRowsEquivalent(sRow, sortedSolution[i] ?? []),
    );

    if (dataMatches) {
      // Identifica qual alias divergiu
      const mismatchedAliases: { actual: string; expected: string }[] = [];
      for (let i = 0; i < studentCols.length; i++) {
        const actual = studentCols[i] ?? '';
        const expected = solutionCols[i] ?? '';
        if (actual.toLowerCase() !== expected.toLowerCase()) {
          mismatchedAliases.push({ actual, expected });
        }
      }

      if (mismatchedAliases.length > 0) {
        const diffDesc = mismatchedAliases
          .map((d) => `A coluna \`${d.actual}\` deveria se chamar \`${d.expected}\`.`)
          .join(' ');
        return {
          status: 'almost',
          message: diffDesc,
          penaltyScore: 12,
        };
      }
    }
  }

  // 5. Cenário WRONG: Demais casos com diagnósticos específicos
  let wrongMessage = 'Os dados retornados não correspondem ao resultado esperado para esta atividade.';

  if (studentRows.length !== solutionRows.length) {
    const sCount = studentRows.length;
    const expCount = solutionRows.length;
    wrongMessage = `Sua consulta retornou ${sCount} ${sCount === 1 ? 'linha' : 'linhas'}, mas eram ${expCount === 1 ? 'esperada 1 linha' : `esperadas ${expCount} linhas`}.`;
  } else if (studentCols.length !== solutionCols.length) {
    wrongMessage = `Sua consulta retornou ${studentCols.length} colunas (${studentCols.join(', ')}), mas eram esperadas ${solutionCols.length} colunas (${solutionCols.join(', ')}).`;
  }

  return {
    status: 'wrong',
    message: wrongMessage,
    penaltyScore: 100,
  };
}
