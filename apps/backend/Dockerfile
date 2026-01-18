FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.6.5

# Copy root package files
COPY package.json pnpm-lock.yaml ./

# Copy backend specific files
COPY apps/backend ./apps/backend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm -F @feed2fedi/backend build

EXPOSE 3001

CMD ["pnpm", "-F", "@feed2fedi/backend", "start:prod"]
