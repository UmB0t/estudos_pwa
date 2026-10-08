export interface NetworkExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface DnsEntry {
  domain: string;
  ip: string;
}

export interface ListeningSocket {
  proto: string;
  state: string;
  recvQ: number;
  sendQ: number;
  localAddress: string;
  peerAddress: string;
  process: string;
}

export class NetworkState {
  public dnsRecords: Record<string, string> = {
    'google.com': '142.250.190.46',
    'github.com': '140.82.121.4',
    'vetor.internal': '10.0.0.1',
    'api.local': '127.0.0.1',
    'localhost': '127.0.0.1',
  };

  public sockets: ListeningSocket[] = [
    {
      proto: 'tcp',
      state: 'LISTEN',
      recvQ: 0,
      sendQ: 511,
      localAddress: '0.0.0.0:80',
      peerAddress: '0.0.0.0:*',
      process: 'users:(("nginx",pid=120,fd=6))',
    },
    {
      proto: 'tcp',
      state: 'LISTEN',
      recvQ: 0,
      sendQ: 128,
      localAddress: '0.0.0.0:22',
      peerAddress: '0.0.0.0:*',
      process: 'users:(("sshd",pid=85,fd=3))',
    },
    {
      proto: 'tcp',
      state: 'LISTEN',
      recvQ: 0,
      sendQ: 244,
      localAddress: '127.0.0.1:5432',
      peerAddress: '0.0.0.0:*',
      process: 'users:(("postgres",pid=310,fd=4))',
    },
  ];

  public httpEndpoints: Record<string, { status: number; headers: Record<string, string>; body: string }> = {
    'http://localhost': {
      status: 200,
      headers: { 'Server': 'nginx/1.25.4', 'Content-Type': 'text/html; charset=utf-8' },
      body: '<!DOCTYPE html>\n<html><head><title>Vetor Nginx</title></head><body><h1>Servidor Web Ativo</h1></body></html>\n',
    },
    'http://localhost:80': {
      status: 200,
      headers: { 'Server': 'nginx/1.25.4', 'Content-Type': 'text/html; charset=utf-8' },
      body: '<!DOCTYPE html>\n<html><head><title>Vetor Nginx</title></head><body><h1>Servidor Web Ativo</h1></body></html>\n',
    },
    'http://127.0.0.1': {
      status: 200,
      headers: { 'Server': 'nginx/1.25.4', 'Content-Type': 'text/html; charset=utf-8' },
      body: '<!DOCTYPE html>\n<html><head><title>Vetor Nginx</title></head><body><h1>Servidor Web Ativo</h1></body></html>\n',
    },
    'http://127.0.0.1:80': {
      status: 200,
      headers: { 'Server': 'nginx/1.25.4', 'Content-Type': 'text/html; charset=utf-8' },
      body: '<!DOCTYPE html>\n<html><head><title>Vetor Nginx</title></head><body><h1>Servidor Web Ativo</h1></body></html>\n',
    },
    'http://api.local/status': {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: '{"status":"healthy","uptime":"14h","database":"connected"}\n',
    },
    'http://vetor.internal': {
      status: 200,
      headers: { 'Server': 'Vetor Gateway' },
      body: 'Gateway OK - Ping 0.4ms\n',
    },
  };

  public clone(): NetworkState {
    const copy = new NetworkState();
    copy.dnsRecords = { ...this.dnsRecords };
    copy.sockets = this.sockets.map((s) => ({ ...s }));
    copy.httpEndpoints = { ...this.httpEndpoints };
    return copy;
  }
}

export class NetworkSession {
  public state: NetworkState;

  constructor(state?: NetworkState) {
    this.state = state ?? new NetworkState();
  }

  public execute(commandLine: string): NetworkExecutionResult {
    const trimmed = commandLine.trim();
    if (!trimmed) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    const tokens = trimmed.split(/\s+/);
    const cmd = tokens[0];
    const args = tokens.slice(1);

    switch (cmd) {
      case 'ping':
        return this.cmdPing(args);
      case 'curl':
        return this.cmdCurl(args);
      case 'ip':
        return this.cmdIp(args);
      case 'ss':
        return this.cmdSs(args);
      case 'nslookup':
        return this.cmdNslookup(args);
      case 'help':
        return {
          stdout:
            'Comandos de diagnóstico de rede suportados:\n' +
            '  ping [-c count] <host>\n' +
            '  curl [-I] [-s] <url>\n' +
            '  ip addr\n' +
            '  ss -lntp\n' +
            '  nslookup <dominio>\n',
          stderr: '',
          exitCode: 0,
        };
      default:
        return {
          stdout: '',
          stderr: `bash: ${cmd}: comando de rede não reconhecido. Use ping, curl, ip addr, ss ou nslookup.\n`,
          exitCode: 127,
        };
    }
  }

  private cmdPing(args: string[]): NetworkExecutionResult {
    let count = 4;
    let target = '';

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (!arg) continue;
      if (arg === '-c' && i + 1 < args.length) {
        const val = args[++i];
        count = val ? parseInt(val, 10) || 4 : 4;
      } else if (!arg.startsWith('-')) {
        target = arg;
      }
    }

    if (!target) {
      return { stdout: '', stderr: 'ping: uso: ping [-c count] destino\n', exitCode: 1 };
    }

    const resolvedIp = this.state.dnsRecords[target] || (target.match(/^\d+\.\d+\.\d+\.\d+$/) ? target : null);
    if (!resolvedIp) {
      return {
        stdout: '',
        stderr: `ping: ${target}: Falha temporária na resolução de nomes\n`,
        exitCode: 2,
      };
    }

    let out = `PING ${target} (${resolvedIp}) 56(84) bytes of data.\n`;
    for (let seq = 1; seq <= count; seq++) {
      const timeMs = (10 + Math.random() * 5).toFixed(1);
      out += `64 bytes de ${resolvedIp}: icmp_seq=${seq} ttl=116 tempo=${timeMs} ms\n`;
    }
    out += `\n--- ${target} estatísticas de ping ---\n`;
    out += `${count} pacotes transmitidos, ${count} recebidos, 0% perda de pacotes, tempo ${count * 1000}ms\n`;

    return { stdout: out, stderr: '', exitCode: 0 };
  }

  private cmdCurl(args: string[]): NetworkExecutionResult {
    let headOnly = false;
    let targetUrl = '';

    for (const arg of args) {
      if (arg === '-I' || arg === '--head') {
        headOnly = true;
      } else if (arg === '-s' || arg === '--silent') {
        // silent flag
      } else if (!arg.startsWith('-')) {
        targetUrl = arg;
      }
    }

    if (!targetUrl) {
      return { stdout: '', stderr: 'curl: try \'curl --help\' for more information\n', exitCode: 2 };
    }

    // Normaliza URL
    let url = targetUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    // Remove barra trailing se for só domínio
    if (url.endsWith('/') && url.split('/').length === 4) {
      url = url.slice(0, -1);
    }

    const endpoint = this.state.httpEndpoints[url];
    if (!endpoint) {
      return {
        stdout: '',
        stderr: `curl: (7) Failed to connect to ${targetUrl} port 80: Connection refused\n`,
        exitCode: 7,
      };
    }

    if (headOnly) {
      let headOut = `HTTP/1.1 ${endpoint.status} ${endpoint.status === 200 ? 'OK' : 'Response'}\n`;
      for (const [k, v] of Object.entries(endpoint.headers)) {
        headOut += `${k}: ${v}\n`;
      }
      headOut += '\n';
      return { stdout: headOut, stderr: '', exitCode: 0 };
    }

    return { stdout: endpoint.body, stderr: '', exitCode: 0 };
  }

  private cmdIp(args: string[]): NetworkExecutionResult {
    const sub = args[0] || 'a';
    if (sub !== 'a' && sub !== 'addr' && sub !== 'address') {
      return { stdout: '', stderr: `Uso: ip addr [show]\n`, exitCode: 1 };
    }

    const output =
      '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n' +
      '    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n' +
      '    inet 127.0.0.1/8 scope host lo\n' +
      '       valid_lft forever preferred_lft forever\n' +
      '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000\n' +
      '    link/ether 02:42:c0:a8:01:69 brd ff:ff:ff:ff:ff:ff\n' +
      '    inet 192.168.1.105/24 brd 192.168.1.255 scope global eth0\n' +
      '       valid_lft forever preferred_lft forever\n';

    return { stdout: output, stderr: '', exitCode: 0 };
  }

  private cmdSs(args: string[]): NetworkExecutionResult {
    const flags = args.join(' ');
    if (!flags.includes('l')) {
      return { stdout: 'State Recv-Q Send-Q Local Address:Port Peer Address:Port Process\n', stderr: '', exitCode: 0 };
    }

    const header = 'Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process\n';
    const lines = this.state.sockets.map((s) => {
      const netid = s.proto.padEnd(5);
      const st = s.state.padEnd(6);
      const rq = String(s.recvQ).padEnd(6);
      const sq = String(s.sendQ).padEnd(6);
      const loc = s.localAddress.padEnd(19);
      const peer = s.peerAddress.padEnd(17);
      return `${netid} ${st} ${rq} ${sq} ${loc} ${peer} ${s.process}`;
    });

    return { stdout: header + lines.join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  private cmdNslookup(args: string[]): NetworkExecutionResult {
    if (args.length === 0 || !args[0]) {
      return { stdout: '', stderr: 'nslookup: uso: nslookup <dominio>\n', exitCode: 1 };
    }

    const domain = args[0];
    const ip = this.state.dnsRecords[domain];

    if (!ip) {
      return {
        stdout: `Server:\t\t192.168.1.1\nAddress:\t192.168.1.1#53\n\n** server can't find ${domain}: NXDOMAIN\n`,
        stderr: '',
        exitCode: 1,
      };
    }

    const output =
      `Server:\t\t192.168.1.1\n` +
      `Address:\t192.168.1.1#53\n\n` +
      `Non-authoritative answer:\n` +
      `Name:\t${domain}\n` +
      `Address: ${ip}\n`;

    return { stdout: output, stderr: '', exitCode: 0 };
  }
}
