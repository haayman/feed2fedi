FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.6.5

# Copy root package files
COPY package.json pnpm-lock.yaml ./

# Copy frontend specific files
COPY apps/frontend ./apps/frontend

# Install dependencies
RUN pnpm install --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "-F", "@feed2fedi/frontend", "dev", "--host"]
