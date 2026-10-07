# ==============================================================================
# Etapa 1: Build da Aplicação Estática (Node.js + pnpm)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Instala pnpm de forma determinística
RUN corepack enable && corepack prepare pnpm@12.9.1 --activate

# Copia configurações raiz do monorepo e lockfile
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml tsconfig.base.json ./

# Copia código-fonte de pacotes, aplicações e datasets
COPY packages ./packages
COPY apps ./apps
COPY content ./content

# Instala todas as dependências com base no lockfile congelado
RUN pnpm install --frozen-lockfile

# Compila todos os pacotes e gera o bundle estático do frontend
RUN pnpm build

# ==============================================================================
# Etapa 2: Servidor Web Estático de Produção (Nginx Alpine)
# ==============================================================================
FROM nginx:1.27-alpine AS runner

# Copia a configuração customizada do Nginx com suporte a COOP/COEP e WASM
COPY infrastructure/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copia os artefatos estáticos compilados do frontend
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Porta padrão de escuta
EXPOSE 80

# Inicia o servidor web
CMD ["nginx", "-g", "daemon off;"]
