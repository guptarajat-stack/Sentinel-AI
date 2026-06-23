FROM node:20-slim AS builder

WORKDIR /app

# Copy package configuration
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source files
COPY src ./src

# Compile TypeScript
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Final runtime image
FROM node:20-slim

WORKDIR /app

# Copy production packages and build output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Environment variables defaults
ENV NODE_ENV=production
ENV SIMULATOR_ENABLE_DB=true
ENV SIMULATOR_ENABLE_STDOUT=true
ENV SIMULATOR_BENIGN_INTERVAL_MS=1500
ENV SIMULATOR_ATTACK_INTERVAL_MIN=3.0

CMD ["node", "dist/index.js"]
