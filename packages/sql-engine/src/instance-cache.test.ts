import { describe, expect, it } from 'vitest';
import { InstanceCache, type Closeable } from './instance-cache';

class MockInstance implements Closeable {
  public id: string;
  public isClosed = false;

  constructor(id: string) {
    this.id = id;
  }

  async close(): Promise<void> {
    this.isClosed = true;
  }
}

describe('InstanceCache', () => {
  it('deve armazenar e recuperar instâncias', async () => {
    const cache = new InstanceCache<MockInstance>(3);
    const inst1 = new MockInstance('inst1');
    await cache.set('k1', inst1);

    expect(cache.get('k1')).toBe(inst1);
    expect(cache.size()).toBe(1);
  });

  it('deve descartar a instância menos recentemente usada (LRU) ao exceder a capacidade', async () => {
    const cache = new InstanceCache<MockInstance>(3);
    const inst1 = new MockInstance('1');
    const inst2 = new MockInstance('2');
    const inst3 = new MockInstance('3');
    const inst4 = new MockInstance('4');

    await cache.set('k1', inst1);
    await cache.set('k2', inst2);
    await cache.set('k3', inst3);

    // Acessa k1 para torná-lo mais recentemente usado: ordem agora é k2 (mais antiga), k3, k1
    cache.get('k1');

    // Insere a 4ª instância: deve descartar k2
    await cache.set('k4', inst4);

    expect(cache.size()).toBe(3);
    expect(cache.get('k2')).toBeUndefined();
    expect(inst2.isClosed).toBe(true);

    expect(cache.get('k1')).toBe(inst1);
    expect(cache.get('k3')).toBe(inst3);
    expect(cache.get('k4')).toBe(inst4);
  });

  it('deve fechar todas as instâncias ao limpar o cache', async () => {
    const cache = new InstanceCache<MockInstance>(3);
    const inst1 = new MockInstance('1');
    const inst2 = new MockInstance('2');

    await cache.set('k1', inst1);
    await cache.set('k2', inst2);

    await cache.clear();
    expect(cache.size()).toBe(0);
    expect(inst1.isClosed).toBe(true);
    expect(inst2.isClosed).toBe(true);
  });
});
