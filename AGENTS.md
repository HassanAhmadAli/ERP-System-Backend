# AGENTS.md — ERP System Backend

NestJS 11 monolith, Prisma 7 + PostgreSQL, Redis, Express, Socket.IO, SWC.

## Quick start

```bash
pnpm install                        # no frozen-lockfile for local
pnpm run db:generate                # Prisma client -> src/prisma/generated/prisma-client
pnpm run db:migrate:minimal         # prisma migrate dev (apply migrations)
pnpm run dev                        # cross-env NODE_ENV=development nest start --watch
```

## Commands

| Command                              | Purpose                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `pnpm run dev`                       | Dev server with watch                                                          |
| `pnpm test`                          | Jest (specs from `test/`)                                                      |
| `pnpm test:e2e`                      | E2E tests only (`*.e2e-spec.ts`)                                               |
| `pnpm run lint`                      | ESLint on `{src,test,prisma}`                                                  |
| `pnpm run format`                    | Prettier on `{src,test,prisma}`                                                |
| `pnpm run build`                     | SWC build to `dist/` (via `nest build`)                                        |
| `pnpm run db:generate`               | Generate Prisma client + zod schemas (from `prisma-zod-generator`)             |
| `pnpm run db:reset`                  | Force reset + migrate + generate + seed                                        |
| `pnpm run db:migrate`                | `prisma migrate dev --name e-store` then executes `prisma/migrate.sql` (empty) |
| `pnpm run db:migrate:minimal`        | Plain `prisma migrate dev`                                                     |
| `pnpm run db:studio`                 | Prisma Studio                                                                  |
| `pnpm run start:repl`                | NestJS REPL (REPL mode)                                                        |
| `pnpm run debug:circular-dependency` | Build then `madge dist/main.js --circular`                                     |

## Architecture

- **Auth**: JWT (custom guard using `@nestjs/jwt`, not passport-jwt) + custom `AuthenticationGuard` (global). Route-level permissions via `PermissionsGuard` (global) using `@setPermissions(Permissions.xxx)` decorator.
- **Validation**: `nestjs-zod` — `ZodValidationPipe` (global), `ZodSerializerInterceptor` (global). Zod v4.
- **Prisma**: Client generated to `src/prisma/generated/prisma-client/` (committed). Uses `@prisma/adapter-pg` (not direct PrismaClient). Extensions: soft-delete (productPhoto only), audit log (all models except AuditLog).
- **Caching**: `@keyv/redis` via `@nestjs/cache-manager` (global, 5min TTL).
- **Queues**: `@nestjs/bullmq` (Redis-backed).
- **WebSockets**: Socket.IO with Redis adapter via `@socket.io/redis-adapter`.
- **Exception handling**: `GlobalExceptionFilter` chains strategies: Zod → HTTP → JWT → Prisma error filters.
- **OpenAPI**: Custom decorators in `src/openapi/decorators.ts` (`@DocumentOperation`, `@DocumentBody`, etc.) wrapping `@nestjs/swagger`. Not raw `@ApiBody`.
- **Logging**: Pino (pretty console) + error-level to `errors.log`.
- **i18n**: `nestjs-i18n` with custom `UserLanguageResolver`, query resolver (`?lang=`), and `Accept-Language` header.
- **Env validation**: Zod schema at `src/common/schema/env.ts` — validated on startup; process crashes if invalid.
- **Path alias**: `@/*` → `./src/*`.
- **Staff roles**: CASHIER, WAREHOUSE_WORKER, ACCOUNTANT, STORE_MANAGER. Customer role: CUSTOMER.

## Key conventions

- **NestJS CLI** generates no spec files (`generateOptions.spec: false`).
- **Modules** follow `{name}.module.ts` / `.controller.ts` / `.service.ts` pattern.
- **DTOs** use `nestjs-zod` (`createZodDto()`). Zod schemas and DTO classes co-exist in `dto/` files (e.g., `shared.schema.ts` inside `dto/`). Reusable utility schemas live in `src/common/schema/`.
- **Permissions** defined in `src/access-control/permission.type.ts` mapped to roles via `PermissionsMap`.
- **Pagination**: `pagination-query.dto.ts` + `paginated()` helper in `src/common/types/paginated-response`.
- **Soft-delete**: via Prisma extension on `productPhoto` model only; other models use hard deletes (schema has `deletedAt` on `User` and `StoredFile` but no extension applies).
- **Audit log**: Prisma extension (`$extends`, not deprecated `$use` middleware) auto-logs create/update/delete on all models (excludes AuditLog, errors). Sensitive fields redacted.
- **Pre-commit**: husky runs `pnpm lint-staged` (Prettier on staged files).
- **Dev scripts require `NODE_ENV=development`**: all `start:*` scripts use `cross-env NODE_ENV=development`.
- **`prisma-zod-generator`** is an optional dependency but NOT configured as a generator in `schema.prisma`; Zod schemas are hand-written.

## Database

- PostgreSQL 16, schema in `prisma/schema.prisma`.
- Migrations: `prisma/migrations/` is gitignored. Use `db:migrate:minimal` for dev.
- Seed: `tsx prisma/seeds/index.ts` (20 seed modules). Runs via `NestFactory.createApplicationContext(SeedModule)` for DI.
- Enums: `UserRole`, `InvoiceStatus`, `OrderStatus`, `DiscountType`, `DiscountScope`, `NotificationTargetType`, `AdPlacement`, `LoyaltyReason`, `ProductImportStatus`.
- `prisma-zod-generator` (optional dep, not wired in schema) generates zod schemas from Prisma models when `prisma generate` runs.

## Testing quirks

- Tests in `test/` only (no `src/**/*.spec.ts`). Uses `ts-jest` with `tsconfig.jest.json` (commonjs, no emit, `resolvePackageJsonExports: false`).
- E2E: `test/app.e2e-spec.ts` starts full `AppModule` via `Test.createTestingModule`.
- Mock for `file-type` at `test/__mocks__/file-type.ts`.
- Test timeout: 30s, `forceExit: true`.
- CI builds only — tests are commented out in CI workflow.
- Requires running PostgreSQL and Redis (see `compose.yaml`). Jest setup loads dotenv at `test/jest.setup.ts`.

## Operational

- Docker: 3 app instances + nginx (`compose.yaml`). App2/App3 have `ENABLE_CRON_JOBS=false`. Port 5433 for Postgres host mapping.
- `.env`: copy `.example.env` → `.env`. Docker uses `.docker.env`.
- `backups/`, `uploads/`, `errors.log` are gitignored, created at runtime, mounted as volumes in Docker.
- Typescript 6.0 — `.swcrc` targets ES2022 with decorator metadata. `noUncheckedIndexedAccess` enabled in tsconfig.
