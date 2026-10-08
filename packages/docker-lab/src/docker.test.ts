import { describe, it, expect, beforeEach } from 'vitest';
import { DockerSession } from './docker';
import { DockerEvaluator } from './evaluator';
import type { Exercise } from '@lab/shared';

describe('DockerSession', () => {
  let session: DockerSession;

  beforeEach(() => {
    session = new DockerSession();
  });

  it('deve listar imagens disponíveis com docker images', () => {
    const res = session.execute('docker images');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain('nginx');
    expect(res.stdout).toContain('postgres');
  });

  it('deve iniciar container em background com docker run -d', () => {
    const res = session.execute('docker run -d -p 8080:80 --name meu-web nginx:latest');
    expect(res.exitCode).toBe(0);
    expect(session.state.containers.length).toBe(1);
    expect(session.state.containers[0]?.names).toBe('meu-web');
    expect(session.state.containers[0]?.status).toContain('Up');

    const psRes = session.execute('docker ps');
    expect(psRes.stdout).toContain('meu-web');
    expect(psRes.stdout).toContain('0.0.0.0:8080->80/tcp');
  });

  it('deve parar e remover containers com docker stop e docker rm', () => {
    session.execute('docker run -d --name test-app alpine:latest');
    expect(session.state.containers.length).toBe(1);

    const stopRes = session.execute('docker stop test-app');
    expect(stopRes.exitCode).toBe(0);
    expect(session.state.containers[0]?.status).toContain('Exited');

    const rmRes = session.execute('docker rm test-app');
    expect(rmRes.exitCode).toBe(0);
    expect(session.state.containers.length).toBe(0);
  });

  it('deve exibir logs com docker logs', () => {
    session.execute('docker run -d --name web nginx');
    const logsRes = session.execute('docker logs web');
    expect(logsRes.exitCode).toBe(0);
    expect(logsRes.stdout).toContain('nginx');
  });
});

describe('DockerEvaluator', () => {
  const evaluator = new DockerEvaluator();

  const mockExercise: Exercise = {
    id: 'docker-run-nginx',
    track: 'docker',
    module: 'containers',
    level: 1,
    title: 'Executar Nginx',
    difficulty: 'easy',
    prerequisites: [],
    question: 'Execute um container do nginx em background mapeando a porta 8080 para a 80',
    orderMatters: false,
    skills: ['docker-run'],
    hints: ['docker run -d -p 8080:80 nginx'],
    solutions: ['docker run -d -p 8080:80 nginx'],
  };

  it('deve validar como correto quando o container é criado com os parâmetros corretos', async () => {
    const result = await evaluator.evaluate({ exercise: mockExercise }, 'docker run -d -p 8080:80 nginx');
    expect(result.status).toBe('correct');
  });

  it('deve acusar erro quando o comando for inválido', async () => {
    const result = await evaluator.evaluate({ exercise: mockExercise }, 'docker run');
    expect(result.status).toBe('wrong');
  });
});
