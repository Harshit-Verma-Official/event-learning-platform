FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for better Docker layer caching
COPY package.json package-lock.json tsconfig.base.json ./

COPY packages/common/package.json packages/common/
COPY packages/contracts/package.json packages/contracts/

COPY services/auth-service/package.json services/auth-service/

# Install dependencies for the entire workspace
RUN npm ci

# Copy source code
COPY packages/common packages/common
COPY packages/contracts packages/contracts
COPY services/auth-service services/auth-service

# Generate Prisma client
WORKDIR /app/services/auth-service

RUN npx prisma generate

# Build TypeScript
RUN npm run build


FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/packages/common ./packages/common
COPY --from=builder /app/packages/contracts ./packages/contracts

COPY --from=builder /app/services/auth-service/package.json ./services/auth-service/package.json
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist

# Prisma files needed for the runtime migration
COPY --from=builder /app/services/auth-service/prisma ./services/auth-service/prisma
COPY --from=builder /app/services/auth-service/prisma.config.ts ./services/auth-service/prisma.config.ts

WORKDIR /app/services/auth-service

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]