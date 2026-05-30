FROM node:24-alpine AS development-dependencies-env

# Install pnpm globally
RUN corepack enable

WORKDIR /app
COPY . /app

RUN pnpm install

FROM node:24-alpine AS production-dependencies-env
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM node:24-alpine AS build-env
RUN corepack enable

WORKDIR /app
COPY . .
COPY --from=development-dependencies-env /app/node_modules ./node_modules

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN test -n "$VITE_API_BASE_URL" || (echo "VITE_API_BASE_URL is required" && exit 1)

RUN pnpm run build

FROM node:24-alpine
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY --from=production-dependencies-env /app/node_modules ./node_modules
COPY --from=build-env /app/build ./build

EXPOSE 3000
CMD ["pnpm", "run", "start"]