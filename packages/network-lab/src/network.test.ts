import { describe, it, expect, beforeEach } from 'vitest';
import { NetworkSession } from './network';
import { NetworkEvaluator } from './evaluator';
import type { Exercise } from '@lab/shared';

describe('NetworkSession', () => {
  let session: NetworkSession;

  beforeEach(() => {
    session = new NetworkSession();
  });

  it('deve simular ping para host conhecido', () => {
    const res = session.execute('ping -c 2 google.com');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain('PING google.com');
    expect(res.stdout).toContain('0% perda de pacotes');
  });

  it('deve efetuar requisição curl com cabeçalhos e body', () => {
    const resBody = session.execute('curl http://localhost');
    expect(resBody.exitCode).toBe(0);
    expect(resBody.stdout).toContain('Servidor Web Ativo');

    const resHead = session.execute('curl -I http://localhost');
    expect(resHead.exitCode).toBe(0);
    expect(resHead.stdout).toContain('HTTP/1.1 200 OK');
    expect(resHead.stdout).toContain('Server: nginx/1.25.4');
  });

  it('deve exibir interfaces com ip addr', () => {
    const res = session.execute('ip addr');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain('eth0');
    expect(res.stdout).toContain('192.168.1.105');
  });

  it('deve inspecionar portas em escuta com ss -lntp', () => {
    const res = session.execute('ss -lntp');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain(':80');
    expect(res.stdout).toContain(':22');
    expect(res.stdout).toContain(':5432');
  });

  it('deve resolver nomes com nslookup', () => {
    const res = session.execute('nslookup google.com');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain('142.250.190.46');
  });
});

describe('NetworkEvaluator', () => {
  const evaluator = new NetworkEvaluator();

  const mockExercise: Exercise = {
    id: 'net-curl-local',
    track: 'networks',
    module: 'diagnostico',
    level: 1,
    title: 'Testar Conexão Web',
    difficulty: 'easy',
    prerequisites: [],
    question: 'Teste a conexão com o servidor local usando curl http://localhost',
    orderMatters: false,
    skills: ['curl'],
    hints: ['curl http://localhost'],
    solutions: ['curl http://localhost'],
  };

  it('deve aprovar comando correto', async () => {
    const result = await evaluator.evaluate({ exercise: mockExercise }, 'curl http://localhost');
    expect(result.status).toBe('correct');
  });
});
