import { describe, it, expect, beforeEach } from 'vitest';
import { VFS } from './vfs';
import { LinuxSession } from './shell';
import { LinuxEvaluator } from './evaluator';
import type { Exercise } from '@lab/shared';

describe('Linux VFS & Shell', () => {
  let vfs: VFS;
  let session: LinuxSession;

  beforeEach(() => {
    vfs = new VFS();
    session = new LinuxSession(vfs);
  });

  it('deve inicializar com a árvore padrão e diretório home do aluno', () => {
    expect(session.cwd).toBe('/home/aluno');
    expect(session.getPrompt()).toBe('aluno@vetor:~$ ');
  });

  it('deve executar pwd retornando o diretório de trabalho atual', () => {
    const res = session.execute('pwd');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe('/home/aluno\n');
  });

  it('deve listar diretórios com ls e flags -a e -l', () => {
    vfs.createFile('/home/aluno/teste.txt', 'conteudo');
    const resSimple = session.execute('ls');
    expect(resSimple.stdout).toContain('teste.txt');

    const resLong = session.execute('ls -l');
    expect(resLong.stdout).toContain('teste.txt');
    expect(resLong.stdout).toContain('rw-r--r--');

    const resAll = session.execute('ls -a');
    expect(resAll.stdout).toContain('.bashrc');
  });

  it('deve mudar de diretório com cd e tratar caminhos relativos e absolutos', () => {
    session.execute('cd /etc');
    expect(session.cwd).toBe('/etc');
    expect(session.getPrompt()).toBe('aluno@vetor:/etc$ ');

    session.execute('cd ..');
    expect(session.cwd).toBe('/');

    session.execute('cd ~');
    expect(session.cwd).toBe('/home/aluno');

    const errRes = session.execute('cd pasta_inexistente');
    expect(errRes.exitCode).toBe(1);
    expect(errRes.stderr).toContain('Arquivo ou diretório não encontrado');
  });

  it('deve criar pastas com mkdir e mkdir -p', () => {
    session.execute('mkdir projetos');
    expect(vfs.getDirectory('/home/aluno/projetos')).toBeDefined();

    session.execute('mkdir -p a/b/c');
    expect(vfs.getDirectory('/home/aluno/a/b/c')).toBeDefined();
  });

  it('deve criar e manipular arquivos com touch, echo > e >>', () => {
    session.execute('touch notas.txt');
    expect(vfs.getFile('/home/aluno/notas.txt')).toBeDefined();

    session.execute('echo "Primeira linha" > notas.txt');
    expect(vfs.getFile('/home/aluno/notas.txt')?.content).toBe('Primeira linha\n');

    session.execute('echo "Segunda linha" >> notas.txt');
    expect(vfs.getFile('/home/aluno/notas.txt')?.content).toBe('Primeira linha\nSegunda linha\n');
  });

  it('deve ler arquivos com cat e buscar com grep', () => {
    vfs.createFile('/home/aluno/servidores.txt', 'web01 192.168.1.10\ndb01 192.168.1.20\ncache01 192.168.1.30');

    const catRes = session.execute('cat servidores.txt');
    expect(catRes.stdout).toContain('db01');

    const grepRes = session.execute('grep db01 servidores.txt');
    expect(grepRes.stdout).toBe('db01 192.168.1.20\n');
    expect(grepRes.exitCode).toBe(0);

    const grepNotFound = session.execute('grep redis servidores.txt');
    expect(grepNotFound.exitCode).toBe(1);
  });

  it('deve copiar, mover e remover arquivos', () => {
    vfs.createFile('/home/aluno/origem.txt', 'dados');

    session.execute('cp origem.txt copia.txt');
    expect(vfs.getFile('/home/aluno/copia.txt')?.content).toBe('dados');

    session.execute('mv copia.txt renomeado.txt');
    expect(vfs.getFile('/home/aluno/copia.txt')).toBeNull();
    expect(vfs.getFile('/home/aluno/renomeado.txt')?.content).toBe('dados');

    session.execute('rm renomeado.txt');
    expect(vfs.getFile('/home/aluno/renomeado.txt')).toBeNull();
  });

  it('deve alterar permissões com chmod', () => {
    vfs.createFile('/home/aluno/script.sh', '#!/bin/bash\n');
    session.execute('chmod 755 script.sh');
    expect(vfs.getFile('/home/aluno/script.sh')?.permissions).toBe('rwxr-xr-x');
  });

  it('deve autocompletar comandos e arquivos com Tab', () => {
    vfs.createFile('/home/aluno/documento.txt', 'teste');
    vfs.createDirectory('/home/aluno/downloads');

    const cmdAuto = session.autocomplete('ca');
    expect(cmdAuto.suggestions).toContain('cat');

    const fileAuto = session.autocomplete('cat doc');
    expect(fileAuto.suggestions).toContain('documento.txt');
  });
});

describe('LinuxEvaluator', () => {
  const evaluator = new LinuxEvaluator();

  const mockExercise: Exercise = {
    id: 'linux-mkdir',
    track: 'linux',
    module: 'navegacao',
    level: 1,
    title: 'Criando Diretório',
    difficulty: 'easy',
    prerequisites: [],
    question: 'Crie um diretório chamado "workspace"',
    orderMatters: false,
    skills: ['mkdir'],
    hints: ['Use o comando mkdir'],
    solutions: ['mkdir workspace'],
  };

  it('deve validar como correto quando o aluno cria o diretório esperado', async () => {
    const result = await evaluator.evaluate({ exercise: mockExercise }, 'mkdir workspace');
    expect(result.status).toBe('correct');
  });

  it('deve indicar erro quando o comando falha', async () => {
    const result = await evaluator.evaluate({ exercise: mockExercise }, 'mkdir');
    expect(result.status).toBe('wrong');
  });

  it('deve indicar errado quando cria diretório com nome incorreto', async () => {
    const result = await evaluator.evaluate({ exercise: mockExercise }, 'mkdir errado');
    expect(result.status).toBe('wrong');
  });
});
