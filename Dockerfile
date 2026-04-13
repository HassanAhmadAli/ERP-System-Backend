FROM node:alpine AS base
RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main postgresql18-client=18.1-r0
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PORT=3000
ENV IS_DOCKER=true
ENV HUSKY_SKIP_INSTALL=true
ENV HUSKY=0

RUN --mount=type=cache,target=/root/.npm,id=npm_cache \
    --mount=type=cache,target=/pnpm,id=pnpm_cache \
    npm install -g pnpm &&\
    pnpm config set store-dir $PNPM_HOME &&\
    pnpm config set prefer-offline &&\
    pnpm config set side-effects-cache

FROM base AS builder
WORKDIR /app
COPY . .
COPY .docker.env ./.env
RUN --mount=type=cache,target=/pnpm,id=pnpm_cache \
    --mount=type=cache,target=/app/node_modules/,id=app_node_modules \
    pnpm install --frozen-lockfile &&\
    pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml  ./
RUN --mount=type=cache,target=/pnpm,id=pnpm_cache \
    pnpm install -P --frozen-lockfile
COPY --from=builder /app/.env /app/dist/ ./dist/
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
CMD ["pnpm", "run", "start:prod"]
USER node
EXPOSE 3000