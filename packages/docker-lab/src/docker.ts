export interface DockerImage {
  repository: string;
  tag: string;
  imageId: string;
  created: string;
  size: string;
}

export interface DockerContainer {
  containerId: string;
  image: string;
  command: string;
  created: string;
  status: string; // e.g. "Up 2 minutes" or "Exited (0) 10 seconds ago"
  ports: string;
  names: string;
  logs: string[];
}

export interface DockerExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class DockerState {
  public images: DockerImage[] = [
    { repository: 'nginx', tag: 'latest', imageId: 'a6be3eab24a4', created: '2 days ago', size: '142MB' },
    { repository: 'postgres', tag: '16', imageId: '7d3824ec981f', created: '1 week ago', size: '379MB' },
    { repository: 'alpine', tag: 'latest', imageId: '91ef0af61139', created: '3 weeks ago', size: '7.34MB' },
    { repository: 'node', tag: '22', imageId: '5b1b72a9df2c', created: '4 days ago', size: '1.1GB' },
  ];

  public containers: DockerContainer[] = [];

  constructor(images?: DockerImage[], containers?: DockerContainer[]) {
    if (images) this.images = [...images];
    if (containers) this.containers = containers.map((c) => ({ ...c, logs: [...c.logs] }));
  }

  public clone(): DockerState {
    return new DockerState(
      this.images.map((img) => ({ ...img })),
      this.containers.map((c) => ({ ...c, logs: [...c.logs] }))
    );
  }
}

/**
 * Tokeniza comandos Docker respeitando aspas.
 */
function tokenizeDocker(cmd: string): string[] {
  const tokens: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (c === '"' || c === "'") {
      inQuote = !inQuote;
    } else if (c === ' ' && !inQuote) {
      if (cur) {
        tokens.push(cur);
        cur = '';
      }
    } else {
      cur += c;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

export class DockerSession {
  public state: DockerState;

  constructor(state?: DockerState) {
    this.state = state ?? new DockerState();
  }

  public execute(commandLine: string): DockerExecutionResult {
    const trimmed = commandLine.trim();
    if (!trimmed) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    const tokens = tokenizeDocker(trimmed);
    if (tokens[0] !== 'docker') {
      return {
        stdout: '',
        stderr: `bash: ${tokens[0]}: comando não encontrado (use 'docker ...')\n`,
        exitCode: 127,
      };
    }

    const sub = tokens[1];
    const args = tokens.slice(2);

    switch (sub) {
      case 'ps':
        return this.cmdPs(args);
      case 'images':
        return this.cmdImages(args);
      case 'run':
        return this.cmdRun(args);
      case 'stop':
        return this.cmdStop(args);
      case 'rm':
        return this.cmdRm(args);
      case 'logs':
        return this.cmdLogs(args);
      case '--help':
      case 'help':
      case undefined:
        return this.cmdHelp();
      default:
        return {
          stdout: '',
          stderr: `docker: '${sub}' is not a docker command.\nSee 'docker --help'\n`,
          exitCode: 1,
        };
    }
  }

  private cmdPs(args: string[]): DockerExecutionResult {
    const showAll = args.includes('-a') || args.includes('--all');
    const filtered = showAll
      ? this.state.containers
      : this.state.containers.filter((c) => c.status.startsWith('Up'));

    if (filtered.length === 0) {
      const header = 'CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES\n';
      return { stdout: header, stderr: '', exitCode: 0 };
    }

    const header = 'CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES\n';
    const lines = filtered.map((c) => {
      const id = c.containerId.padEnd(14);
      const img = c.image.padEnd(14);
      const cmd = `"${c.command}"`.padEnd(24);
      const crt = c.created.padEnd(15);
      const st = c.status.padEnd(14);
      const prt = c.ports.padEnd(24);
      const nm = c.names;
      return `${id} ${img} ${cmd} ${crt} ${st} ${prt} ${nm}`;
    });

    return { stdout: header + lines.join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  private cmdImages(_args: string[]): DockerExecutionResult {
    const header = 'REPOSITORY   TAG       IMAGE ID       CREATED        SIZE\n';
    const lines = this.state.images.map((img) => {
      const repo = img.repository.padEnd(12);
      const tag = img.tag.padEnd(9);
      const id = img.imageId.padEnd(14);
      const crt = img.created.padEnd(14);
      const sz = img.size;
      return `${repo} ${tag} ${id} ${crt} ${sz}`;
    });
    return { stdout: header + lines.join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  private cmdRun(args: string[]): DockerExecutionResult {
    let detached = false;
    let name: string | null = null;
    let ports = '';
    const positional: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (!arg) continue;
      if (arg === '-d' || arg === '--detach') {
        detached = true;
      } else if (arg === '--name' && i + 1 < args.length) {
        name = args[++i] ?? null;
      } else if ((arg === '-p' || arg === '--publish') && i + 1 < args.length) {
        ports = args[++i] ?? '';
      } else if (!arg.startsWith('-')) {
        positional.push(arg);
      }
    }

    if (positional.length === 0 || !positional[0]) {
      return { stdout: '', stderr: '"docker run" requires at least 1 argument.\nSee \'docker run --help\'.\n', exitCode: 1 };
    }

    const imageRef = positional[0];
    const [imageRepo] = imageRef.split(':');
    const foundImage = this.state.images.find((img) => img.repository === imageRepo || `${img.repository}:${img.tag}` === imageRef);

    if (!foundImage) {
      return {
        stdout: '',
        stderr: `Unable to find image '${imageRef}' locally\ndocker: Error response from daemon: pull access denied for ${imageRef}, repository does not exist or may require 'docker login'.\n`,
        exitCode: 1,
      };
    }

    // Gerar ID pseudo-aleatório consistente de container
    const randomHex = Math.random().toString(16).slice(2, 14).padEnd(12, '0');
    const containerName = name ?? `relaxed_${foundImage.repository}_${randomHex.slice(0, 4)}`;
    const [hostPort, containerPort] = ports.includes(':') ? ports.split(':') : [ports, ports];
    const portMapping = ports ? `0.0.0.0:${hostPort}->${containerPort}/tcp` : '';

    let command = '/bin/sh';
    let defaultLogs = ['Application started successfully.'];

    if (imageRepo === 'nginx') {
      command = 'nginx -g "daemon of…';
      defaultLogs = [
        '2026/10/07 12:00:00 [notice] 1#1: using the "epoll" event method',
        '2026/10/07 12:00:00 [notice] 1#1: nginx/1.25.4',
        '2026/10/07 12:00:00 [notice] 1#1: start worker processes',
        '2026/10/07 12:00:00 [notice] 1#1: start worker process 29',
      ];
    } else if (imageRepo === 'postgres') {
      command = 'docker-entrypoint.s…';
      defaultLogs = [
        'PostgreSQL Database directory appears to contain a database; Skipping initialization',
        '2026-10-07 12:00:00.000 UTC [1] LOG:  database system is ready to accept connections',
      ];
    }

    const newContainer: DockerContainer = {
      containerId: randomHex,
      image: imageRef,
      command,
      created: 'Just now',
      status: 'Up 1 second',
      ports: portMapping,
      names: containerName,
      logs: defaultLogs,
    };

    this.state.containers.unshift(newContainer);

    if (detached) {
      return { stdout: `${randomHex}\n`, stderr: '', exitCode: 0 };
    }

    return { stdout: defaultLogs.join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  private cmdStop(args: string[]): DockerExecutionResult {
    if (args.length === 0 || !args[0]) {
      return { stdout: '', stderr: '"docker stop" requires at least 1 argument.\n', exitCode: 1 };
    }

    const target = args[0];
    const container = this.state.containers.find(
      (c) => c.containerId.startsWith(target) || c.names === target
    );

    if (!container) {
      return { stdout: '', stderr: `Error response from daemon: No such container: ${target}\n`, exitCode: 1 };
    }

    container.status = 'Exited (0) 1 second ago';
    return { stdout: `${target}\n`, stderr: '', exitCode: 0 };
  }

  private cmdRm(args: string[]): DockerExecutionResult {
    if (args.length === 0) {
      return { stdout: '', stderr: '"docker rm" requires at least 1 argument.\n', exitCode: 1 };
    }

    const target = args.find((a) => !a.startsWith('-')) || '';
    const index = this.state.containers.findIndex(
      (c) => c.containerId.startsWith(target) || c.names === target
    );

    if (index === -1) {
      return { stdout: '', stderr: `Error response from daemon: No such container: ${target}\n`, exitCode: 1 };
    }

    const container = this.state.containers[index];
    if (!container) {
      return { stdout: '', stderr: `Error response from daemon: No such container: ${target}\n`, exitCode: 1 };
    }

    if (container.status.startsWith('Up') && !args.includes('-f')) {
      return {
        stdout: '',
        stderr: `Error response from daemon: You cannot remove a running container ${container.containerId}. Stop the container before attempting removal or force remove\n`,
        exitCode: 1,
      };
    }

    this.state.containers.splice(index, 1);
    return { stdout: `${target}\n`, stderr: '', exitCode: 0 };
  }

  private cmdLogs(args: string[]): DockerExecutionResult {
    if (args.length === 0) {
      return { stdout: '', stderr: '"docker logs" requires at least 1 argument.\n', exitCode: 1 };
    }

    const target = args.find((a) => !a.startsWith('-')) || '';
    const container = this.state.containers.find(
      (c) => c.containerId.startsWith(target) || c.names === target
    );

    if (!container) {
      return { stdout: '', stderr: `Error response from daemon: No such container: ${target}\n`, exitCode: 1 };
    }

    return { stdout: container.logs.join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  private cmdHelp(): DockerExecutionResult {
    const help =
      'Usage:  docker [OPTIONS] COMMAND\n\n' +
      'A self-contained runtime for containers\n\n' +
      'Management Commands:\n' +
      '  container   Manage containers\n' +
      '  image       Manage images\n\n' +
      'Commands:\n' +
      '  ps          List containers\n' +
      '  images      List images\n' +
      '  run         Run a command in a new container\n' +
      '  stop        Stop one or more running containers\n' +
      '  rm          Remove one or more containers\n' +
      '  logs        Fetch the logs of a container\n';
    return { stdout: help, stderr: '', exitCode: 0 };
  }
}
