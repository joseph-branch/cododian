# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

# Install only needed files
COPY package.json package-lock.json* ./
RUN pnpm install --production=false

COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript -> JavaScript
RUN pnpm run build

# Stage 2: Run
FROM node:20-slim

WORKDIR /app

# Only copy production stuff
COPY --from=builder /app/dist ./dist
COPY package.json ./

RUN pnpm install --production

EXPOSE 8080

CMD ["node", "dist/index.js"]