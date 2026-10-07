import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import type { WorkerFactory, WorkerTransport } from './worker-transport';

export class NodeWorkerFactory implements WorkerFactory {
  createWorker(): WorkerTransport {
    const runnerUrl = new URL('./node-worker-runner.mjs', import.meta.url);
    const worker = new Worker(fileURLToPath(runnerUrl));

    return {
      postMessage(msg: unknown): void {
        worker.postMessage(msg);
      },
      onMessage(handler: (message: unknown) => void): void {
        worker.on('message', handler);
      },
      onError(handler: (error: Error) => void): void {
        worker.on('error', handler);
      },
      async terminate(): Promise<void> {
        await worker.terminate();
      },
    };
  }
}
