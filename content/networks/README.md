# Trilha Redes (Fase 3)

Especificação do formato e arquitetura dos exercícios da trilha Redes de Computadores.

## Visão Geral
Na Fase 3, a trilha Redes apresentará diagnósticos e ferramentas essenciais de infraestrutura (`ping`, `curl`, `ss`/`netstat`, `dig`/`nslookup`, `traceroute`, `ip addr`) com topologias de rede virtuais simuladas em memória no navegador.

## Formato dos Exercícios (content/networks/exercises/*.json)

```json
{
  "id": "net-01-curl-status-code",
  "track": "networks",
  "module": "http-diagnostic",
  "level": 1,
  "title": "Inspecionar cabeçalhos HTTP com curl",
  "difficulty": "easy",
  "prerequisites": [],
  "question": "Use o curl para fazer uma requisição apenas dos cabeçalhos HTTP (HEAD) para a URL http://api.interno/health.",
  "virtualNetwork": {
    "hosts": {
      "api.interno": {
        "ports": {
          "80": { "headers": "HTTP/1.1 200 OK\r\nContent-Type: application/json", "body": "{\"status\":\"healthy\"}" }
        }
      }
    }
  },
  "skills": ["curl", "http", "headers"],
  "hints": [
    "A flag -I ou --head no curl solicita apenas os cabeçalhos HTTP sem o corpo.",
    "Aponte para http://api.interno/health."
  ],
  "solutions": [
    "curl -I http://api.interno/health",
    "curl --head http://api.interno/health"
  ],
  "explanation": "O método HTTP HEAD (solicitado via curl -I) solicita ao servidor exatamente os mesmos cabeçalhos que um GET retornaria, mas sem transmitir o corpo da mensagem, poupando banda e tempo de diagnóstico."
}
```

## Motor de Avaliação Futuro (@lab/network-lab)
- Simulador de pilha TCP/IP básica e simulação de resolução DNS em memória.
- Avaliação de saídas de diagnósticos conceituais e comandos corretos de inspeção.
