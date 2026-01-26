FROM node:20-alpine AS development-dependencies-env

# Install pnpm globally
RUN corepack enable

WORKDIR /app
COPY . /app

RUN pnpm install

FROM node:20-alpine AS production-dependencies-env
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM node:20-alpine AS build-env
RUN corepack enable

WORKDIR /app
COPY . .
COPY --from=development-dependencies-env /app/node_modules ./node_modules
RUN pnpm run build

FROM node:20-alpine
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY --from=production-dependencies-env /app/node_modules ./node_modules
COPY --from=build-env /app/build ./build

CMD ["pnpm", "run", "start"]