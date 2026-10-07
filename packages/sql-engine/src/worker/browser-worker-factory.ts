import type { WorkerFactory, WorkerTransport } from './worker-transport';

export class BrowserWorkerFactory implements WorkerFactory {
  createWorker(): WorkerTransport {
    const worker = new Worker(new URL('./browser-worker.ts', import.meta.url), {
      type: 'module',
    });

    return {
      postMessage(msg: unknown): void {
        worker.postMessage(msg);
      },
      onMessage(handler: (message: unknown) => void): void {
        worker.onmessage = (e) => handler(e.data);
      },
      onError(handler: (error: Error) => void): void {
        worker.onerror = (e) => handler(new Error(e.message || 'Worker error'));
      },
      terminate(): void {
        worker.terminate();
      },
    };
  }
}
