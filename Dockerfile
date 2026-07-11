# Stage 1: Build & compile TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# Prune node_modules to remove devDependencies while keeping production Prisma engines
RUN npm prune --production

# Stage 2: Production execution
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 5001
CMD ["node", "dist/server.js"]
