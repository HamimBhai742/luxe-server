# Stage 1: Build & compile TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency manifests + prisma config first for better layer caching
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

# Install all dependencies (postinstall runs prisma generate here)
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune devDependencies (ignore-scripts prevents re-running prisma generate)
RUN npm prune --production --ignore-scripts

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Copy prisma schema (needed for migrations/introspection at runtime)
COPY --from=builder /app/prisma ./prisma
# Copy generated Prisma client
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 5001
CMD ["node", "dist/server.js"]
