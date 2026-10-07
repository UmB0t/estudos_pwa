export interface WorkerTransport {
  postMessage(message: unknown): void;
  onMessage(handler: (message: unknown) => void): void;
  onError(handler: (error: Error) => void): void;
  terminate(): Promise<void> | void;
}

export interface WorkerFactory {
  createWorker(): WorkerTransport;
}
