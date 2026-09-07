FROM node:22-alpine

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

EXPOSE 3001

CMD ["npm", "start"]