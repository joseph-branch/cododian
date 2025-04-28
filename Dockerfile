# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only manifest files first for caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including dev)
RUN pnpm install

# Copy the rest of the code
COPY tsconfig.json ./
COPY src/ ./src/

# Build the app (TypeScript -> JavaScript)
RUN pnpm run build

# Stage 2: Production Image
FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy ONLY runtime deps
COPY package.json pnpm-lock.yaml ./

# Install production deps only
RUN pnpm install --prod

# Copy the built app
COPY --from=builder /app/dist ./dist

# Expose the port Cloud Run expects
EXPOSE 8080

# Start the server
CMD ["node", "dist/index.js"]