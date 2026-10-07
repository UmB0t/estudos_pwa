export function stripSqlComments(sql: string): string {
  // Remove comentários de linha única: -- ...
  const withoutSingleLine = sql.replace(/--[^\r\n]*/g, '');
  // Remove comentários de bloco: /* ... */
  const withoutMultiLine = withoutSingleLine.replace(/\/\*[\s\S]*?\*\//g, '');
  return withoutMultiLine.trim();
}

export interface ValidationResult {
  valid: boolean;
  sanitizedSql: string;
  error?: string;
}

export function validateSqlAllowlist(sql: string): ValidationResult {
  const sanitized = stripSqlComments(sql);

  if (!sanitized) {
    return {
      valid: false,
      sanitizedSql: '',
      error: 'A consulta SQL está vazia.',
    };
  }

  // Allowlist: após remover comentários e espaços, deve iniciar com SELECT, WITH ou ( seguido de SELECT
  const allowlistRegex = /^\s*(?:\(\s*)*(?:SELECT|WITH)\b/i;

  if (!allowlistRegex.test(sanitized)) {
    return {
      valid: false,
      sanitizedSql: sanitized,
      error:
        'Apenas consultas de leitura iniciadas com SELECT ou WITH são permitidas nesta atividade.',
    };
  }

  return {
    valid: true,
    sanitizedSql: sanitized,
  };
}
