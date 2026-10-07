# Trilha Docker (Fase 3)

Especificação do formato e arquitetura dos exercícios da trilha Docker.

## Visão Geral
Na Fase 3, a trilha Docker executará um simulador de CLI do Docker em TypeScript client-side no navegador. Não há daemon Docker real, socket ou container de verdade.

## Formato dos Exercícios (content/docker/exercises/*.json)

```json
{
  "id": "docker-01-run-nginx",
  "track": "docker",
  "module": "containers",
  "level": 1,
  "title": "Executar um container NGINX em background",
  "difficulty": "easy",
  "prerequisites": [],
  "question": "Execute um container com a imagem 'nginx:alpine' em segundo plano (-d), mapeando a porta 8080 do host para a porta 80 do container, com o nome 'meu-web'.",
  "initialDockerState": {
    "images": ["nginx:alpine", "ubuntu:22.04"],
    "containers": []
  },
  "expectedDockerState": {
    "containers": [
      {
        "name": "meu-web",
        "image": "nginx:alpine",
        "status": "running",
        "ports": { "8080": "80" }
      }
    ]
  },
  "skills": ["docker-run", "ports", "daemon"],
  "hints": [
    "Utilize a flag -d para rodar em modo detached (segundo plano).",
    "Use -p 8080:80 e --name meu-web."
  ],
  "solutions": [
    "docker run -d -p 8080:80 --name meu-web nginx:alpine",
    "docker container run -d -p 8080:80 --name meu-web nginx:alpine"
  ],
  "explanation": "O comando docker run cria e inicia um novo container. As flags -d, -p e --name definem execução em background, mapeamento de portas e rótulo de identificação."
}
```

## Motor de Avaliação Futuro (@lab/docker-lab)
- Parser de comandos da CLI (`docker run`, `docker ps`, `docker build`, `docker stop`, `docker rm`).
- Simulador de registro de imagens locais e tabela de containers ativos.
