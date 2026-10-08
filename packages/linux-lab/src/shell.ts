import { VFS } from './vfs';

export interface ShellExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  cwd: string;
}

export interface AutocompleteResult {
  suggestions: string[];
  replacement: string;
  prefix: string;
}

/**
 * Divide uma linha de comando em tokens respeitando aspas simples e duplas.
 */
export function tokenizeCommand(commandLine: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inDoubleQuote = false;
  let inSingleQuote = false;

  for (let i = 0; i < commandLine.length; i++) {
    const char = commandLine[i];

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === ' ' && !inDoubleQuote && !inSingleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Sessão Interativa do Shell Linux Virtual
 */
export class LinuxSession {
  public vfs: VFS;
  public cwd = '/home/aluno';
  public user = 'aluno';
  public hostname = 'vetor';
  private previousDir = '/home/aluno';
  private commandHistory: string[] = [];

  constructor(vfs?: VFS, initialCwd = '/home/aluno') {
    this.vfs = vfs ?? new VFS();
    this.cwd = initialCwd;
    this.previousDir = initialCwd;
  }

  public getPrompt(): string {
    const displayPath =
      this.cwd === '/home/aluno'
        ? '~'
        : this.cwd.startsWith('/home/aluno/')
          ? '~' + this.cwd.slice('/home/aluno'.length)
          : this.cwd;
    const promptChar = this.user === 'root' ? '#' : '$';
    return `${this.user}@${this.hostname}:${displayPath}${promptChar} `;
  }

  public getHistory(): string[] {
    return [...this.commandHistory];
  }

  /**
   * Executa uma linha de comando ou múltiplas instruções separadas por ';' ou '&&'.
   */
  public execute(commandLine: string): ShellExecutionResult {
    const trimmed = commandLine.trim();
    if (!trimmed) {
      return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
    }

    this.commandHistory.push(trimmed);

    // Suporte a múltiplos comandos encadeados com ';' ou '&&'
    if (trimmed.includes(';') || trimmed.includes('&&')) {
      const isAnd = trimmed.includes('&&');
      const parts = isAnd ? trimmed.split('&&') : trimmed.split(';');

      let fullStdout = '';
      let lastResult: ShellExecutionResult = { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };

      for (const part of parts) {
        const subCmd = part.trim();
        if (!subCmd) continue;

        lastResult = this.executeSingle(subCmd);
        fullStdout += lastResult.stdout;

        if (isAnd && lastResult.exitCode !== 0) {
          return {
            stdout: fullStdout,
            stderr: lastResult.stderr,
            exitCode: lastResult.exitCode,
            cwd: this.cwd,
          };
        }
      }

      return {
        stdout: fullStdout,
        stderr: lastResult.stderr,
        exitCode: lastResult.exitCode,
        cwd: this.cwd,
      };
    }

    return this.executeSingle(trimmed);
  }

  private executeSingle(commandLine: string): ShellExecutionResult {
    // Tratar redirecionamento de saída (>> e >)
    let redirectionType: '>' | '>>' | null = null;
    let targetOutputFile = '';
    let cmdToRun = commandLine;

    if (commandLine.includes('>>')) {
      const parts = commandLine.split('>>');
      cmdToRun = (parts[0] ?? '').trim();
      targetOutputFile = (parts[1] ?? '').trim();
      redirectionType = '>>';
    } else if (commandLine.includes('>')) {
      const parts = commandLine.split('>');
      cmdToRun = (parts[0] ?? '').trim();
      targetOutputFile = (parts[1] ?? '').trim();
      redirectionType = '>';
    }

    const tokens = tokenizeCommand(cmdToRun);
    if (tokens.length === 0) {
      return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
    }

    const cmd = tokens[0];
    const args = tokens.slice(1);

    let result: ShellExecutionResult;

    switch (cmd) {
      case 'pwd':
        result = this.cmdPwd(args);
        break;
      case 'ls':
        result = this.cmdLs(args);
        break;
      case 'cd':
        result = this.cmdCd(args);
        break;
      case 'cat':
        result = this.cmdCat(args);
        break;
      case 'mkdir':
        result = this.cmdMkdir(args);
        break;
      case 'touch':
        result = this.cmdTouch(args);
        break;
      case 'rm':
        result = this.cmdRm(args);
        break;
      case 'cp':
        result = this.cmdCp(args);
        break;
      case 'mv':
        result = this.cmdMv(args);
        break;
      case 'echo':
        result = this.cmdEcho(args);
        break;
      case 'grep':
        result = this.cmdGrep(args);
        break;
      case 'chmod':
        result = this.cmdChmod(args);
        break;
      case 'whoami':
        result = { stdout: `${this.user}\n`, stderr: '', exitCode: 0, cwd: this.cwd };
        break;
      case 'clear':
        result = { stdout: '\x1bc', stderr: '', exitCode: 0, cwd: this.cwd };
        break;
      case 'history':
        result = {
          stdout: this.commandHistory.map((h, i) => `  ${i + 1}  ${h}`).join('\n') + '\n',
          stderr: '',
          exitCode: 0,
          cwd: this.cwd,
        };
        break;
      case 'help':
        result = {
          stdout:
            'Comandos suportados no Vetor Linux Lab:\n' +
            '  pwd, ls [-l -a], cd, cat, mkdir [-p], touch, rm [-r -f], cp [-r], mv, echo [> >>], grep [-i -n], chmod, whoami, clear, history\n',
          stderr: '',
          exitCode: 0,
          cwd: this.cwd,
        };
        break;
      default:
        result = {
          stdout: '',
          stderr: `bash: ${cmd}: comando não encontrado\n`,
          exitCode: 127,
          cwd: this.cwd,
        };
        break;
    }

    // Se houve redirecionamento e o comando teve sucesso
    if (redirectionType && targetOutputFile && result.exitCode === 0) {
      try {
        const fullTargetPath = this.vfs.resolvePath(this.cwd, targetOutputFile);
        const existing = this.vfs.getFile(fullTargetPath);

        if (redirectionType === '>>' && existing) {
          existing.content += result.stdout;
          existing.updatedAt = new Date();
        } else {
          this.vfs.createFile(fullTargetPath, result.stdout);
        }

        return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { stdout: '', stderr: `bash: ${targetOutputFile}: ${msg}\n`, exitCode: 1, cwd: this.cwd };
      }
    }

    return result;
  }

  private cmdPwd(_args: string[]): ShellExecutionResult {
    return { stdout: `${this.cwd}\n`, stderr: '', exitCode: 0, cwd: this.cwd };
  }

  private cmdLs(args: string[]): ShellExecutionResult {
    let showAll = false;
    let longFormat = false;
    const paths: string[] = [];

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('a')) showAll = true;
        if (arg.includes('l')) longFormat = true;
      } else {
        paths.push(arg);
      }
    }

    const targetPath = paths.length > 0 && paths[0] ? this.vfs.resolvePath(this.cwd, paths[0]) : this.cwd;
    const node = this.vfs.getNode(targetPath);

    if (!node) {
      return {
        stdout: '',
        stderr: `ls: não foi possível acessar '${paths[0] ?? targetPath}': Arquivo ou diretório não encontrado\n`,
        exitCode: 2,
        cwd: this.cwd,
      };
    }

    if (node.type === 'file') {
      if (longFormat) {
        return {
          stdout: `${node.permissions} 1 ${node.owner} ${node.group} ${node.content.length} ${node.name}\n`,
          stderr: '',
          exitCode: 0,
          cwd: this.cwd,
        };
      }
      return { stdout: `${node.name}\n`, stderr: '', exitCode: 0, cwd: this.cwd };
    }

    const entries: Array<{ name: string; isDir: boolean; perms: string; owner: string; group: string; size: number }> =
      [];

    if (showAll) {
      entries.push({ name: '.', isDir: true, perms: 'rwxr-xr-x', owner: node.owner, group: node.group, size: 4096 });
      entries.push({ name: '..', isDir: true, perms: 'rwxr-xr-x', owner: node.owner, group: node.group, size: 4096 });
    }

    for (const [name, child] of node.children.entries()) {
      if (!showAll && name.startsWith('.')) {
        continue;
      }
      entries.push({
        name,
        isDir: child.type === 'directory',
        perms: child.permissions,
        owner: child.owner,
        group: child.group,
        size: child.type === 'file' ? child.content.length : 4096,
      });
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    if (entries.length === 0) {
      return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
    }

    if (longFormat) {
      const lines = entries.map(
        (e) => `${e.isDir ? 'd' : '-'}${e.perms} 1 ${e.owner} ${e.group} ${e.size} ${e.name}`
      );
      return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0, cwd: this.cwd };
    }

    return { stdout: entries.map((e) => e.name).join('  ') + '\n', stderr: '', exitCode: 0, cwd: this.cwd };
  }

  private cmdCd(args: string[]): ShellExecutionResult {
    let target = args[0] || '~';

    if (target === '-') {
      target = this.previousDir;
    }

    const resolved = this.vfs.resolvePath(this.cwd, target);
    const node = this.vfs.getNode(resolved);

    if (!node) {
      return {
        stdout: '',
        stderr: `bash: cd: ${target}: Arquivo ou diretório não encontrado\n`,
        exitCode: 1,
        cwd: this.cwd,
      };
    }

    if (node.type !== 'directory') {
      return {
        stdout: '',
        stderr: `bash: cd: ${target}: Não é um diretório\n`,
        exitCode: 1,
        cwd: this.cwd,
      };
    }

    this.previousDir = this.cwd;
    this.cwd = resolved;
    return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
  }

  private cmdCat(args: string[]): ShellExecutionResult {
    if (args.length === 0) {
      return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
    }

    let output = '';
    for (const fileArg of args) {
      const resolved = this.vfs.resolvePath(this.cwd, fileArg);
      const node = this.vfs.getNode(resolved);

      if (!node) {
        return {
          stdout: output,
          stderr: `cat: ${fileArg}: Arquivo ou diretório não encontrado\n`,
          exitCode: 1,
          cwd: this.cwd,
        };
      }

      if (node.type === 'directory') {
        return {
          stdout: output,
          stderr: `cat: ${fileArg}: É um diretório\n`,
          exitCode: 1,
          cwd: this.cwd,
        };
      }

      output += node.content;
    }

    return { stdout: output, stderr: '', exitCode: 0, cwd: this.cwd };
  }

  private cmdMkdir(args: string[]): ShellExecutionResult {
    let recursive = false;
    const paths: string[] = [];

    for (const arg of args) {
      if (arg === '-p' || arg === '--parents') {
        recursive = true;
      } else {
        paths.push(arg);
      }
    }

    if (paths.length === 0) {
      return { stdout: '', stderr: 'mkdir: operando ausente\n', exitCode: 1, cwd: this.cwd };
    }

    for (const p of paths) {
      try {
        const resolved = this.vfs.resolvePath(this.cwd, p);
        this.vfs.createDirectory(resolved, recursive, 'rwxr-xr-x', this.user, this.user);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { stdout: '', stderr: `mkdir: não foi possível criar o diretório '${p}': ${msg}\n`, exitCode: 1, cwd: this.cwd };
      }
    }

    return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
  }

  private cmdTouch(args: string[]): ShellExecutionResult {
    if (args.length === 0) {
      return { stdout: '', stderr: 'touch: operando de arquivo ausente\n', exitCode: 1, cwd: this.cwd };
    }

    for (const p of args) {
      const resolved = this.vfs.resolvePath(this.cwd, p);
      const existing = this.vfs.getNode(resolved);
      if (existing) {
        existing.updatedAt = new Date();
      } else {
        this.vfs.createFile(resolved, '', 'rw-r--r--', this.user, this.user);
      }
    }

    return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
  }

  private cmdRm(args: string[]): ShellExecutionResult {
    let recursive = false;
    let force = false;
    const paths: string[] = [];

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('r') || arg.includes('R')) recursive = true;
        if (arg.includes('f')) force = true;
      } else {
        paths.push(arg);
      }
    }

    if (paths.length === 0) {
      if (force) return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
      return { stdout: '', stderr: 'rm: operando ausente\n', exitCode: 1, cwd: this.cwd };
    }

    for (const p of paths) {
      const resolved = this.vfs.resolvePath(this.cwd, p);
      const node = this.vfs.getNode(resolved);

      if (!node) {
        if (force) continue;
        return {
          stdout: '',
          stderr: `rm: não foi possível remover '${p}': Arquivo ou diretório não encontrado\n`,
          exitCode: 1,
          cwd: this.cwd,
        };
      }

      if (node.type === 'directory' && !recursive) {
        return {
          stdout: '',
          stderr: `rm: não foi possível remover '${p}': É um diretório\n`,
          exitCode: 1,
          cwd: this.cwd,
        };
      }

      this.vfs.removeNode(resolved, recursive);
    }

    return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
  }

  private cmdCp(args: string[]): ShellExecutionResult {
    let recursive = false;
    const paths: string[] = [];

    for (const arg of args) {
      if (arg === '-r' || arg === '-R') {
        recursive = true;
      } else {
        paths.push(arg);
      }
    }

    if (paths.length < 2 || !paths[0] || !paths[1]) {
      return { stdout: '', stderr: 'cp: operando de arquivo ausente\n', exitCode: 1, cwd: this.cwd };
    }

    const src = this.vfs.resolvePath(this.cwd, paths[0]);
    const dest = this.vfs.resolvePath(this.cwd, paths[1]);

    try {
      this.vfs.copyNode(src, dest, recursive);
      return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { stdout: '', stderr: `cp: ${msg}\n`, exitCode: 1, cwd: this.cwd };
    }
  }

  private cmdMv(args: string[]): ShellExecutionResult {
    if (args.length < 2 || !args[0] || !args[1]) {
      return { stdout: '', stderr: 'mv: operando de destino ausente\n', exitCode: 1, cwd: this.cwd };
    }

    const src = this.vfs.resolvePath(this.cwd, args[0]);
    const dest = this.vfs.resolvePath(this.cwd, args[1]);

    try {
      this.vfs.moveNode(src, dest);
      return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { stdout: '', stderr: `mv: ${msg}\n`, exitCode: 1, cwd: this.cwd };
    }
  }

  private cmdEcho(args: string[]): ShellExecutionResult {
    const text = args.join(' ');
    // Se o argumento possuía aspas externas, já foram removidas pelo tokenizer
    return { stdout: `${text}\n`, stderr: '', exitCode: 0, cwd: this.cwd };
  }

  private cmdGrep(args: string[]): ShellExecutionResult {
    let caseInsensitive = false;
    let showLineNumbers = false;
    const positional: string[] = [];

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('i')) caseInsensitive = true;
        if (arg.includes('n')) showLineNumbers = true;
      } else {
        positional.push(arg);
      }
    }

    if (positional.length < 2 || !positional[0]) {
      return { stdout: '', stderr: 'grep: uso: grep [-i -n] PADRÃO ARQUIVO...\n', exitCode: 2, cwd: this.cwd };
    }

    const pattern = positional[0];
    const fileArgs = positional.slice(1);
    const regex = new RegExp(pattern, caseInsensitive ? 'i' : '');

    let matches = '';
    for (const f of fileArgs) {
      const resolved = this.vfs.resolvePath(this.cwd, f);
      const fileNode = this.vfs.getFile(resolved);

      if (!fileNode) {
        return {
          stdout: matches,
          stderr: `grep: ${f}: Arquivo ou diretório não encontrado\n`,
          exitCode: 2,
          cwd: this.cwd,
        };
      }

      const lines = fileNode.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line !== undefined && regex.test(line)) {
          if (showLineNumbers) {
            matches += `${i + 1}:${line}\n`;
          } else {
            matches += `${line}\n`;
          }
        }
      }
    }

    return {
      stdout: matches,
      stderr: '',
      exitCode: matches ? 0 : 1,
      cwd: this.cwd,
    };
  }

  private cmdChmod(args: string[]): ShellExecutionResult {
    if (args.length < 2) {
      return { stdout: '', stderr: 'chmod: operando ausente\n', exitCode: 1, cwd: this.cwd };
    }

    const mode = args[0];
    const targets = args.slice(1);

    for (const t of targets) {
      const resolved = this.vfs.resolvePath(this.cwd, t);
      const node = this.vfs.getNode(resolved);

      if (!node) {
        return {
          stdout: '',
          stderr: `chmod: não foi possível acessar '${t}': Arquivo ou diretório não encontrado\n`,
          exitCode: 1,
          cwd: this.cwd,
        };
      }

      if (mode === '+x') {
        node.permissions = node.permissions.replace(/-(?=-|$)/g, 'x');
      } else if (mode === '755') {
        node.permissions = 'rwxr-xr-x';
      } else if (mode === '644') {
        node.permissions = 'rw-r--r--';
      } else if (mode === '600') {
        node.permissions = 'rw-------';
      } else if (mode === '777') {
        node.permissions = 'rwxrwxrwx';
      }
    }

    return { stdout: '', stderr: '', exitCode: 0, cwd: this.cwd };
  }

  /**
   * Fornece autocompletar ao pressionar Tab.
   */
  public autocomplete(inputLine: string): AutocompleteResult {
    const trimmed = inputLine.trimStart();
    const parts = trimmed.split(' ');
    const lastWord = parts[parts.length - 1] || '';

    // Se é o primeiro termo e não tem barra, autocompleta comandos
    if (parts.length <= 1 && !lastWord.includes('/')) {
      const availableCommands = [
        'pwd',
        'ls',
        'cd',
        'cat',
        'mkdir',
        'touch',
        'rm',
        'cp',
        'mv',
        'echo',
        'grep',
        'chmod',
        'whoami',
        'clear',
        'history',
        'help',
      ];
      const matches = availableCommands.filter((c) => c.startsWith(lastWord));
      return {
        suggestions: matches,
        replacement: matches.length === 1 ? matches[0] + ' ' : lastWord,
        prefix: lastWord,
      };
    }

    // Autocompleta caminhos de arquivos e diretórios
    let searchDir = this.cwd;
    let filePrefix = lastWord;

    if (lastWord.includes('/')) {
      const lastSlash = lastWord.lastIndexOf('/');
      const dirPart = lastWord.slice(0, lastSlash) || '/';
      filePrefix = lastWord.slice(lastSlash + 1);
      searchDir = this.vfs.resolvePath(this.cwd, dirPart);
    }

    const dirNode = this.vfs.getDirectory(searchDir);
    if (!dirNode) {
      return { suggestions: [], replacement: lastWord, prefix: filePrefix };
    }

    const matches: string[] = [];
    for (const [name, node] of dirNode.children.entries()) {
      if (name.startsWith(filePrefix)) {
        matches.push(node.type === 'directory' ? `${name}/` : name);
      }
    }

    let replacement = lastWord;
    if (matches.length === 1 && matches[0]) {
      if (lastWord.includes('/')) {
        const lastSlash = lastWord.lastIndexOf('/');
        replacement = lastWord.slice(0, lastSlash + 1) + matches[0];
      } else {
        replacement = matches[0];
      }
    }

    return {
      suggestions: matches,
      replacement,
      prefix: filePrefix,
    };
  }
}
