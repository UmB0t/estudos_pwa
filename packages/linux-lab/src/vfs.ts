export interface VfsFile {
  type: 'file';
  name: string;
  content: string;
  permissions: string; // e.g. "rw-r--r--"
  owner: string;
  group: string;
  updatedAt: Date;
}

export interface VfsDirectory {
  type: 'directory';
  name: string;
  permissions: string; // e.g. "rwxr-xr-x"
  owner: string;
  group: string;
  updatedAt: Date;
  children: Map<string, VfsNode>;
}

export type VfsNode = VfsFile | VfsDirectory;

export interface VfsSnapshotEntry {
  type: 'file' | 'directory';
  content?: string;
  permissions: string;
}

export type VfsSnapshot = Record<string, VfsSnapshotEntry>;

/**
 * Normaliza caminhos UNIX resolvendo '.', '..' e barras duplas.
 */
export function normalizePath(path: string): string {
  const isAbsolute = path.startsWith('/');
  const segments = path.split('/').filter((s) => s.length > 0 && s !== '.');
  const resolved: string[] = [];

  for (const seg of segments) {
    if (seg === '..') {
      if (resolved.length > 0) {
        resolved.pop();
      }
    } else {
      resolved.push(seg);
    }
  }

  const result = (isAbsolute ? '/' : '') + resolved.join('/');
  return result === '' ? (isAbsolute ? '/' : '.') : result;
}

/**
 * Sistema de Arquivos Virtual em Memória com suporte a árvore hierárquica e permissões POSIX.
 */
export class VFS {
  private root: VfsDirectory;

  constructor(root?: VfsDirectory) {
    if (root) {
      this.root = root;
    } else {
      this.root = {
        type: 'directory',
        name: '',
        permissions: 'rwxr-xr-x',
        owner: 'root',
        group: 'root',
        updatedAt: new Date(),
        children: new Map(),
      };
      this.initDefaultTree();
    }
  }

  private initDefaultTree(): void {
    this.createDirectory('/home', true, 'rwxr-xr-x', 'root', 'root');
    this.createDirectory('/home/aluno', true, 'rwxr-xr-x', 'aluno', 'aluno');
    this.createDirectory('/etc', true, 'rwxr-xr-x', 'root', 'root');
    this.createDirectory('/tmp', true, 'rwxrwxrwt', 'root', 'root');
    this.createDirectory('/var', true, 'rwxr-xr-x', 'root', 'root');
    this.createDirectory('/var/log', true, 'rwxr-xr-x', 'root', 'root');
    this.createDirectory('/usr', true, 'rwxr-xr-x', 'root', 'root');
    this.createDirectory('/usr/bin', true, 'rwxr-xr-x', 'root', 'root');

    this.createFile('/etc/hostname', 'vetor-lab\n', 'rw-r--r--', 'root', 'root');
    this.createFile('/etc/os-release', 'NAME="Vetor Linux"\nID=vetor\nVERSION="1.0"\n', 'rw-r--r--', 'root', 'root');
    this.createFile('/home/aluno/.bashrc', '# Vetor Shell config\nexport PS1="\\u@\\h:\\w\\$ "\n', 'rw-r--r--', 'aluno', 'aluno');
  }

  public resolvePath(cwd: string, path: string): string {
    let target = path.trim();
    if (target === '~' || target.startsWith('~/')) {
      target = '/home/aluno' + target.slice(1);
    }

    if (target.startsWith('/')) {
      return normalizePath(target);
    }

    const combined = cwd.endsWith('/') ? `${cwd}${target}` : `${cwd}/${target}`;
    return normalizePath(combined);
  }

  public getNode(absolutePath: string): VfsNode | null {
    const clean = normalizePath(absolutePath);
    if (clean === '/') {
      return this.root;
    }

    const parts = clean.split('/').filter(Boolean);
    let current: VfsNode = this.root;

    for (const part of parts) {
      if (current.type !== 'directory') {
        return null;
      }
      const child = current.children.get(part);
      if (!child) {
        return null;
      }
      current = child;
    }

    return current;
  }

  public getFile(absolutePath: string): VfsFile | null {
    const node = this.getNode(absolutePath);
    return node && node.type === 'file' ? node : null;
  }

  public getDirectory(absolutePath: string): VfsDirectory | null {
    const node = this.getNode(absolutePath);
    return node && node.type === 'directory' ? node : null;
  }

  public createDirectory(
    absolutePath: string,
    recursive = false,
    permissions = 'rwxr-xr-x',
    owner = 'aluno',
    group = 'aluno'
  ): VfsDirectory {
    const clean = normalizePath(absolutePath);
    if (clean === '/') {
      return this.root;
    }

    const parts = clean.split('/').filter(Boolean);
    let current: VfsDirectory = this.root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      const isLast = i === parts.length - 1;
      const child = current.children.get(part);

      if (child) {
        if (child.type !== 'directory') {
          throw new Error(`Caminho intermediário '${part}' não é um diretório`);
        }
        current = child;
      } else {
        if (!isLast && !recursive) {
          throw new Error(`Não foi possível criar '${clean}': Arquivo ou diretório não encontrado`);
        }
        const newDir: VfsDirectory = {
          type: 'directory',
          name: part,
          permissions: isLast ? permissions : 'rwxr-xr-x',
          owner,
          group,
          updatedAt: new Date(),
          children: new Map(),
        };
        current.children.set(part, newDir);
        current = newDir;
      }
    }

    return current;
  }

  public createFile(
    absolutePath: string,
    content = '',
    permissions = 'rw-r--r--',
    owner = 'aluno',
    group = 'aluno'
  ): VfsFile {
    const clean = normalizePath(absolutePath);
    const lastSlash = clean.lastIndexOf('/');
    const dirPath = lastSlash === 0 ? '/' : clean.slice(0, lastSlash);
    const fileName = clean.slice(lastSlash + 1);

    if (!fileName) {
      throw new Error(`Nome de arquivo inválido: '${clean}'`);
    }

    let parentDir = this.getDirectory(dirPath);
    if (!parentDir) {
      parentDir = this.createDirectory(dirPath, true);
    }

    const existing = parentDir.children.get(fileName);
    if (existing) {
      if (existing.type === 'directory') {
        throw new Error(`'${fileName}' é um diretório`);
      }
      existing.content = content;
      existing.updatedAt = new Date();
      return existing;
    }

    const file: VfsFile = {
      type: 'file',
      name: fileName,
      content,
      permissions,
      owner,
      group,
      updatedAt: new Date(),
    };
    parentDir.children.set(fileName, file);
    return file;
  }

  public removeNode(absolutePath: string, recursive = false): boolean {
    const clean = normalizePath(absolutePath);
    if (clean === '/') {
      throw new Error('Não é permitido remover a raiz /');
    }

    const lastSlash = clean.lastIndexOf('/');
    const dirPath = lastSlash === 0 ? '/' : clean.slice(0, lastSlash);
    const name = clean.slice(lastSlash + 1);

    const parentDir = this.getDirectory(dirPath);
    if (!parentDir) {
      return false;
    }

    const target = parentDir.children.get(name);
    if (!target) {
      return false;
    }

    if (target.type === 'directory') {
      if (!recursive && target.children.size > 0) {
        throw new Error(`Diretório '${name}' não está vazio`);
      }
    }

    return parentDir.children.delete(name);
  }

  public copyNode(sourcePath: string, destPath: string, recursive = false): boolean {
    const sourceNode = this.getNode(sourcePath);
    if (!sourceNode) {
      throw new Error(`Origem '${sourcePath}' não encontrada`);
    }

    const destClean = normalizePath(destPath);
    const destNode = this.getNode(destClean);

    let finalDest = destClean;
    if (destNode && destNode.type === 'directory') {
      finalDest = normalizePath(`${destClean}/${sourceNode.name}`);
    }

    if (sourceNode.type === 'file') {
      this.createFile(finalDest, sourceNode.content, sourceNode.permissions, sourceNode.owner, sourceNode.group);
      return true;
    }

    if (sourceNode.type === 'directory') {
      if (!recursive) {
        throw new Error(`-r não especificado; omitindo diretório '${sourceNode.name}'`);
      }
      this.createDirectory(finalDest, true, sourceNode.permissions, sourceNode.owner, sourceNode.group);
      for (const [childName] of sourceNode.children.entries()) {
        const childSrc = `${normalizePath(sourcePath)}/${childName}`;
        const childDest = `${finalDest}/${childName}`;
        this.copyNode(childSrc, childDest, true);
      }
      return true;
    }

    return false;
  }

  public moveNode(sourcePath: string, destPath: string): boolean {
    const srcClean = normalizePath(sourcePath);
    if (srcClean === '/') {
      throw new Error('Não é permitido mover a raiz /');
    }

    const sourceNode = this.getNode(srcClean);
    if (!sourceNode) {
      throw new Error(`'${srcClean}': Arquivo ou diretório não encontrado`);
    }

    this.copyNode(srcClean, destPath, true);
    this.removeNode(srcClean, true);
    return true;
  }

  public clone(): VFS {
    const cloneDir = (dir: VfsDirectory): VfsDirectory => {
      const copy: VfsDirectory = {
        type: 'directory',
        name: dir.name,
        permissions: dir.permissions,
        owner: dir.owner,
        group: dir.group,
        updatedAt: new Date(dir.updatedAt),
        children: new Map(),
      };
      for (const [k, v] of dir.children.entries()) {
        if (v.type === 'directory') {
          copy.children.set(k, cloneDir(v));
        } else {
          copy.children.set(k, {
            type: 'file',
            name: v.name,
            content: v.content,
            permissions: v.permissions,
            owner: v.owner,
            group: v.group,
            updatedAt: new Date(v.updatedAt),
          });
        }
      }
      return copy;
    };

    return new VFS(cloneDir(this.root));
  }

  public snapshot(basePath = '/'): VfsSnapshot {
    const snap: VfsSnapshot = {};
    const traverse = (dir: VfsDirectory, currentPath: string) => {
      for (const [name, node] of dir.children.entries()) {
        const fullPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
        if (node.type === 'file') {
          snap[fullPath] = {
            type: 'file',
            content: node.content,
            permissions: node.permissions,
          };
        } else {
          snap[fullPath] = {
            type: 'directory',
            permissions: node.permissions,
          };
          traverse(node, fullPath);
        }
      }
    };

    const startNode = this.getNode(basePath);
    if (startNode && startNode.type === 'directory') {
      traverse(startNode, normalizePath(basePath));
    }
    return snap;
  }
}
