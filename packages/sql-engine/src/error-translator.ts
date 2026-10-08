export interface TranslatedError {
  message: string;
  details: string;
  code?: string;
}

export function translateSqlError(err: unknown): TranslatedError {
  let originalMessage = 'Erro desconhecido';
  if (err instanceof Error) {
    originalMessage = err.message;
  } else if (typeof err === 'string') {
    originalMessage = err;
  } else if (typeof err === 'object' && err !== null && 'message' in err) {
    originalMessage = String((err as { message: unknown }).message);
  }

  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : undefined;

  // 1. Múltiplas instruções em query() (antes de tratar código 42601)
  if (/cannot insert multiple commands into a prepared statement/i.test(originalMessage)) {
    return {
      message: 'Apenas uma única instrução SQL pode ser executada por vez.',
      details: originalMessage,
      code: code ?? '42601',
    };
  }

  // 2. Modificação em transação somente leitura (25006)
  if (code === '25006' || /read-only transaction/i.test(originalMessage)) {
    return {
      message:
        'Comandos de modificação de dados (INSERT, UPDATE, DELETE, etc.) não são permitidos nesta consulta.',
      details: originalMessage,
      code: code ?? '25006',
    };
  }

  // 3. Timeout (57014)
  if (code === '57014' || /statement timeout|timeout/i.test(originalMessage)) {
    return {
      message: 'A consulta excedeu o tempo limite de execução (timeout).',
      details: originalMessage,
      code: code ?? '57014',
    };
  }

  // 4. Tabela não encontrada (42P01 ou regex de relação inexistente)
  const relationMatch = originalMessage.match(/relation "([^"]+)" does not exist/i);
  if (relationMatch?.[1] || code === '42P01') {
    const tableName = relationMatch?.[1];
    return {
      message: tableName
        ? `A tabela "${tableName}" não foi encontrada no banco de dados.`
        : 'A tabela informada não foi encontrada no banco de dados.',
      details: originalMessage,
      code: code ?? '42P01',
    };
  }

  // 5. Coluna não encontrada (42703 ou regex de coluna inexistente)
  const columnMatch = originalMessage.match(/column "([^"]+)" does not exist/i);
  if (columnMatch?.[1] || code === '42703') {
    const columnName = columnMatch?.[1];
    return {
      message: columnName
        ? `A coluna "${columnName}" não existe.`
        : 'Uma ou mais colunas informadas não existem na tabela.',
      details: originalMessage,
      code: code ?? '42703',
    };
  }

  // 6. Erro de sintaxe (42601 ou regex de sintaxe)
  const syntaxNearMatch = originalMessage.match(/syntax error at or near "([^"]+)"/i);
  const syntaxEndOfInput = /syntax error at (?:or near )?end of input/i.test(originalMessage);
  const isSyntaxError =
    code === '42601' ||
    Boolean(syntaxNearMatch) ||
    syntaxEndOfInput ||
    /syntax error/i.test(originalMessage);

  if (isSyntaxError) {
    if (syntaxNearMatch?.[1]) {
      return {
        message: `Erro de sintaxe próximo a "${syntaxNearMatch[1]}". Verifique a escrita do comando.`,
        details: originalMessage,
        code: code ?? '42601',
      };
    }
    if (syntaxEndOfInput) {
      return {
        message:
          'Erro de sintaxe: instrução incompleta no final do comando. Verifique se faltou informar o nome da tabela, coluna ou condição.',
        details: originalMessage,
        code: code ?? '42601',
      };
    }
    return {
      message: 'Erro de sintaxe SQL. Verifique a escrita e a pontuação do comando.',
      details: originalMessage,
      code: code ?? '42601',
    };
  }

  // 6.1 Aspas não finalizadas
  if (/unterminated quoted string/i.test(originalMessage)) {
    return {
      message: 'Erro de sintaxe: aspas abertas não foram fechadas corretamente.',
      details: originalMessage,
      code: code ?? '42601',
    };
  }

  // 7. Divisão por zero (22012)
  if (code === '22012' || /division by zero/i.test(originalMessage)) {
    return {
      message: 'Operação inválida: divisão por zero.',
      details: originalMessage,
      code: code ?? '22012',
    };
  }

  // Fallback padrão
  return {
    message: `Erro ao executar a consulta: ${originalMessage}`,
    details: originalMessage,
    code,
  };
}
