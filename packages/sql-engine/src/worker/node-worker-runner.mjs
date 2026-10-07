import { parentPort } from 'node:worker_threads';
import { PGlite } from '@electric-sql/pglite';

if (!parentPort) {
  throw new Error('node-worker-runner deve ser executado como um worker thread.');
}

function stripComments(sql) {
  const withoutSingle = sql.replace(/--[^\r\n]*/g, '');
  return withoutSingle.replace(/\/\*[\s\S]*?\*\//g, '').trim();
}

function validateAllowlist(sql) {
  const sanitized = stripComments(sql);
  if (!sanitized) {
    return { valid: false, error: 'A consulta SQL está vazia.' };
  }
  const regex = /^\s*(?:\(\s*)*(?:SELECT|WITH)\b/i;
  if (!regex.test(sanitized)) {
    return {
      valid: false,
      error: 'Apenas consultas de leitura iniciadas com SELECT ou WITH são permitidas nesta atividade.',
    };
  }
  return { valid: true, sanitizedSql: sanitized };
}

function translateError(err) {
  const originalMessage = err instanceof Error ? err.message : String(err);
  const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : undefined;

  const relMatch = originalMessage.match(/relation "([^"]+)" does not exist/i);
  if (relMatch || code === '42P01') {
    const table = relMatch?.[1];
    return {
      message: table
        ? `A tabela "${table}" não foi encontrada no banco de dados.`
        : 'A tabela informada não foi encontrada no banco de dados.',
      details: originalMessage,
      code: code ?? '42P01',
    };
  }

  const colMatch = originalMessage.match(/column "([^"]+)" does not exist/i);
  if (colMatch || code === '42703') {
    const col = colMatch?.[1];
    return {
      message: col
        ? `A coluna "${col}" não existe.`
        : 'Uma ou mais colunas informadas não existem na tabela.',
      details: originalMessage,
      code: code ?? '42703',
    };
  }

  const synMatch = originalMessage.match(/syntax error at or near "([^"]+)"/i);
  if (synMatch || code === '42601') {
    const near = synMatch?.[1];
    return {
      message: near
        ? `Erro de sintaxe próximo a "${near}". Verifique a escrita do comando.`
        : 'Erro de sintaxe SQL. Verifique a escrita do comando.',
      details: originalMessage,
      code: code ?? '42601',
    };
  }

  if (code === '25006' || /read-only transaction/i.test(originalMessage)) {
    return {
      message:
        'Comandos de modificação de dados (INSERT, UPDATE, DELETE, etc.) não são permitidos nesta consulta.',
      details: originalMessage,
      code: code ?? '25006',
    };
  }

  if (code === '57014' || /statement timeout|timeout/i.test(originalMessage)) {
    return {
      message: 'A consulta excedeu o tempo limite de execução (timeout).',
      details: originalMessage,
      code: code ?? '57014',
    };
  }

  if (/cannot insert multiple commands/i.test(originalMessage)) {
    return {
      message: 'Apenas uma única instrução SQL pode ser executada por vez.',
      details: originalMessage,
      code: code ?? '42601',
    };
  }

  return {
    message: `Erro ao executar a consulta: ${originalMessage}`,
    details: originalMessage,
    code,
  };
}

let db = null;
let isClosed = false;

parentPort.on('message', async (msg) => {
  if (!msg || typeof msg !== 'object') return;
  const { id, type } = msg;

  try {
    if (type === 'init') {
      db = new PGlite();
      await db.waitReady;
      if (msg.datasetSql && msg.datasetSql.trim()) {
        await db.exec(msg.datasetSql);
      }
      if (msg.setupSql && msg.setupSql.trim()) {
        await db.exec(msg.setupSql);
      }
      parentPort.postMessage({ id, type: 'ready' });
      return;
    }

    if (type === 'query') {
      if (!db || isClosed) {
        parentPort.postMessage({
          id,
          type: 'result',
          payload: {
            success: false,
            error: 'O ambiente SQL não está pronto ou foi encerrado.',
            details: 'Database uninitialized or closed',
          },
        });
        return;
      }

      const val = validateAllowlist(msg.sql);
      if (!val.valid) {
        parentPort.postMessage({
          id,
          type: 'result',
          payload: {
            success: false,
            error: val.error,
            details: val.error,
          },
        });
        return;
      }

      await db.exec('BEGIN TRANSACTION READ ONLY;');
      try {
        const raw = await db.query(val.sanitizedSql, [], { rowMode: 'array' });
        const columns = raw.fields.map((f) => f.name);
        const rows = raw.rows;
        parentPort.postMessage({
          id,
          type: 'result',
          payload: {
            success: true,
            result: { columns, rows },
          },
        });
      } catch (err) {
        const translated = translateError(err);
        parentPort.postMessage({
          id,
          type: 'result',
          payload: {
            success: false,
            error: translated.message,
            details: translated.details,
            code: translated.code,
          },
        });
      } finally {
        try {
          await db.exec('ROLLBACK;');
        } catch {
          // ignora
        }
      }
      return;
    }

    if (type === 'close') {
      isClosed = true;
      if (db) {
        await db.close();
      }
      return;
    }
  } catch (err) {
    const translated = translateError(err);
    parentPort.postMessage({
      id,
      type: 'error',
      error: translated.message,
      details: translated.details,
      code: translated.code,
    });
  }
});
