FROM node:22-alpine

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

EXPOSE 3003

CMD ["npm", "start"]