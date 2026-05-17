# ERP Store Backend

NestJS API for store management (dashboard and mobile clients). PostgreSQL, Redis, JWT auth, and Socket.IO notifications.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)
- Docker and Docker Compose (for Postgres and Redis)

## Quick start

1. Copy environment variables:

   ```bash
   cp .example.env .env
   ```

2. Fill in `.env` (minimum):

   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://postgres:password123@localhost:5433/postgres
   REDIS_DATABASE_URL=redis://localhost:6379
   JWT_SECRET=your_jwt_secret_here
   APP_EMAIL_HOST=smtp.example.com
   APP_EMAIL_User=you@example.com
   APP_EMAIL_Password=your_password
   ```

3. Start infrastructure:

   ```bash
   docker compose up -d postgres_db redis_db
   ```

4. Install dependencies and reset the database (migrate + seed):

   ```bash
   pnpm run reset:dev
   ```

5. Run the API:

   ```bash
   pnpm dev
   ```

## API

| Resource | URL                            |
| -------- | ------------------------------ |
| Base URL | `http://localhost:3000/api/v1` |
| Swagger  | `http://localhost:3000/doc`    |

All protected routes require `Authorization: Bearer <access_token>`.

## Seed accounts

Password for all seed users: `12345678`

| Role               | Email                       |
| ------------------ | --------------------------- |
| Admin              | `admin.user@example.com`    |
| Employee (cashier) | `employee.user@example.com` |
| Manager            | `manager.user@example.com`  |
| Customer           | `customer.user@example.com` |

Sign in via role-specific routes, e.g. `POST /authentication/employee/signin`.

## Orders example

```bash
# Customer places an order
CTOKEN=$(curl -s -X POST http://localhost:3000/authentication/customer/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"customer.user@example.com","password":"12345678"}' | jq -r .access_token)

curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer $CTOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":1}],"deliveryAddress":"123 Main St"}'

# Employee advances order status
ETOKEN=$(curl -s -X POST http://localhost:3000/authentication/employee/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"employee.user@example.com","password":"12345678"}' | jq -r .access_token)

curl -X PATCH http://localhost:3000/orders/1/status \
  -H "Authorization: Bearer $ETOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"PREPARING"}'
```

## Sales (POS) example

```bash
# Sign in as employee
TOKEN=$(curl -s -X POST http://localhost:3000/authentication/employee/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"employee.user@example.com","password":"12345678"}' | jq -r .access_token)

# Create and complete a sale
curl -X POST http://localhost:3000/sales/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":1}],"amountPaid":100,"complete":true}'
```

## Purchases, expenses & reports

```bash
# Admin / manager
ATOKEN=$(curl -s -X POST http://localhost:3000/authentication/admin/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin.user@example.com","password":"12345678"}' | jq -r .access_token)

# Receive stock from supplier
curl -X POST http://localhost:3000/purchase/invoices \
  -H "Authorization: Bearer $ATOKEN" -H "Content-Type: application/json" \
  -d '{"supplierId":1,"invoiceDate":"2026-05-15","receive":true,"items":[{"productId":1,"quantity":10,"unitCost":50}]}'

# Record expense
curl -X POST http://localhost:3000/expenses \
  -H "Authorization: Bearer $ATOKEN" -H "Content-Type: application/json" \
  -d '{"description":"Rent","category":"Overhead","amount":500,"expenseDate":"2026-05-15"}'

# Dashboard summary
curl -s http://localhost:3000/reports/summary -H "Authorization: Bearer $ATOKEN" | jq
```

## Scripts

| Command          | Description             |
| ---------------- | ----------------------- |
| `pnpm dev`       | Start in watch mode     |
| `pnpm build`     | Production build        |
| `pnpm db:reset`  | Reset DB, migrate, seed |
| `pnpm db:studio` | Prisma Studio           |

## Implementation plan

See [docs/implementation-plan.md](docs/implementation-plan.md) for the full product roadmap.
