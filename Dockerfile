# Requires a host-side build first: pnpm run build
FROM node:24-slim
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PORT=3000
ENV IS_DOCKER=true
ENV NODE_ENV=production
ENV HUSKY_SKIP_INSTALL=true
ENV HUSKY=0

RUN --mount=type=cache,target=/root/.npm,id=npm_cache \
    --mount=type=cache,target=/pnpm,id=pnpm_cache \
    npm install -g pnpm &&\
    pnpm config set store-dir $PNPM_HOME &&\
    pnpm config set prefer-offline &&\
    pnpm config set network-concurrency 1 &&\
    pnpm config set side-effects-cache

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/pnpm,id=pnpm_cache \
    pnpm install -P --frozen-lockfile

COPY dist/ ./dist/
COPY src ./src
COPY src/i18n ./dist/i18n
COPY .docker.env ./.env
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
CMD ["pnpm", "run", "start:prod"]
USER node
EXPOSE 3000
