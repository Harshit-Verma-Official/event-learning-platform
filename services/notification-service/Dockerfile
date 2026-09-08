FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for better Docker layer caching
COPY package.json package-lock.json tsconfig.base.json ./

COPY packages/common/package.json packages/common/
COPY packages/contracts/package.json packages/contracts/

COPY services/notification-service/package.json services/notification-service/

# Install dependencies for the entire workspace
RUN npm ci

# Copy source code
COPY packages/common packages/common
COPY packages/contracts packages/contracts
COPY services/notification-service services/notification-service

# Generate Prisma client
WORKDIR /app/services/notification-service

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

COPY --from=builder /app/services/notification-service/package.json ./services/notification-service/package.json
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist

# Prisma files needed for the runtime migration
COPY --from=builder /app/services/notification-service/prisma ./services/notification-service/prisma
COPY --from=builder /app/services/notification-service/prisma.config.ts ./services/notification-service/prisma.config.ts

WORKDIR /app/services/notification-service

EXPOSE 3003

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]