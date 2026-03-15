# Babloo v2 — Full Rebuild Codex Prompts

> **Reference:** See `docs/plans/2026-03-08-v2-clean-rebuild-design.md` for full architecture design.

**Goal:** Rebuild the Babloo home services marketplace from scratch with clean architecture: tRPC + Fastify + Expo Router + Prisma + Socket.IO.

**V1 Reference Repo:** https://github.com/n0cap/Bab-Lma.git — Clone this before starting. Many files can be copied directly from v1 with minor adaptations. Each prompt specifies what to copy vs what to write fresh.

**Execution order:** Prompts 1-5 (API) must run sequentially. Prompts 6-10 (Mobile) must run sequentially after Prompt 1 is done (they depend on the shared package). API and Mobile tracks can run in parallel after Prompt 1.

---

## Execution Order & Dependencies

```
Prompt 1: Foundation (monorepo + shared + prisma)
    ├── Prompt 2: API Auth
    │   └── Prompt 3: API Orders + Pricing
    │       └── Prompt 4: API Real-time + Negotiation
    │           └── Prompt 5: API Pro + Admin + Jobs
    └── Prompt 6: Mobile Foundation + Auth
        └── Prompt 7: Mobile Booking + Orders
            └── Prompt 8: Mobile Chat + Negotiation
                └── Prompt 9: Mobile Pro Screens
                    └── Prompt 10: Mobile Polish (Tracking, Rating, i18n, Push)
```

---

## Prompt 1 — Foundation: Monorepo + Shared Package + Prisma Schema

**Give to Codex:**

```
Goal: Set up a new monorepo for a home services marketplace called "Babloo". This prompt creates the project skeleton, shared package, and database schema. Most business logic is copied from v1 (https://github.com/n0cap/Bab-Lma.git) with structural improvements.

IMPORTANT: Clone https://github.com/n0cap/Bab-Lma.git into a temporary location first. You will copy files from it throughout this prompt.

Tech stack:
- Monorepo: Turborepo + pnpm workspaces
- Shared package: TypeScript + Zod (pure, no framework deps)
- Database: PostgreSQL + Prisma 6
- Local dev: Docker Compose (PostgreSQL + Redis)

=== STEP 1: Monorepo scaffolding (WRITE FRESH) ===

Create the following directory structure:

babloo-v2/
├── apps/
│   ├── api/           (package.json + tsconfig only for now)
│   └── mobile/        (package.json only for now)
├── packages/
│   ├── shared/
│   └── config/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── docker-compose.yml
├── .gitignore
├── .env.example
└── .npmrc

File: pnpm-workspace.yaml
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

File: package.json
```json
{
  "name": "babloo-v2",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "db:generate": "pnpm --filter @babloo/api prisma generate",
    "db:migrate": "pnpm --filter @babloo/api prisma migrate dev",
    "db:seed": "pnpm --filter @babloo/api prisma db seed",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

File: turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

File: docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: babloo
      POSTGRES_PASSWORD: babloo_dev
      POSTGRES_DB: babloo_dev
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

File: .env.example
```
# Database
DATABASE_URL="postgresql://babloo:babloo_dev@localhost:5432/babloo_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="change-me-to-a-32-char-minimum-secret-key-in-production"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="30d"

# OTP
OTP_TTL_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT_PER_15MIN=3

# SMS (mock in dev)
SMS_PROVIDER="mock"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Server
PORT=3000
NODE_ENV="development"
CORS_ORIGINS="http://localhost:8081"

# Sentry (optional)
SENTRY_DSN=""
```

File: .gitignore
```
node_modules/
dist/
.env
*.log
.turbo/
.expo/
ios/
android/
```

File: .npmrc
```
auto-install-peers=true
```

File: packages/config/tsconfig.base.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

File: packages/config/package.json
```json
{
  "name": "@babloo/config",
  "private": true,
  "version": "0.0.1"
}
```

=== STEP 2: Shared package (COPY FROM V1 + RESTRUCTURE) ===

File: packages/shared/package.json
```json
{
  "name": "@babloo/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./schemas": "./dist/schemas/index.js",
    "./types": "./dist/types/index.js",
    "./pricing": "./dist/pricing/index.js",
    "./fsm": "./dist/fsm/index.js",
    "./errors": "./dist/errors/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "peerDependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "zod": "^3.24.0"
  }
}
```

File: packages/shared/tsconfig.json
```json
{
  "extends": "../config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

COPY these files verbatim from v1 (Bab-Lma repo):
- v1: packages/shared/src/types/enums.ts     → v2: packages/shared/src/types/enums.ts
- v1: packages/shared/src/types/models.ts    → v2: packages/shared/src/types/models.ts
- v1: packages/shared/src/types/api.ts       → v2: packages/shared/src/types/api.ts
- v1: packages/shared/src/types/index.ts     → v2: packages/shared/src/types/index.ts
- v1: packages/shared/src/fsm.ts            → v2: packages/shared/src/fsm/order-status.ts (rename file, keep content)
- v1: packages/shared/src/phone.ts          → v2: packages/shared/src/phone.ts
- v1: packages/shared/src/pricing/menage.ts  → v2: packages/shared/src/pricing/menage.ts
- v1: packages/shared/src/pricing/cuisine.ts → v2: packages/shared/src/pricing/cuisine.ts
- v1: packages/shared/src/pricing/childcare.ts → v2: packages/shared/src/pricing/childcare.ts
- v1: packages/shared/src/pricing/types.ts   → v2: packages/shared/src/pricing/types.ts
- v1: packages/shared/src/pricing/index.ts   → v2: packages/shared/src/pricing/index.ts

COPY these files from v1 but rename to new structure:
- v1: packages/shared/src/validation/auth.ts        → v2: packages/shared/src/schemas/input/auth.input.ts
- v1: packages/shared/src/validation/orders.ts      → v2: packages/shared/src/schemas/input/order.input.ts
- v1: packages/shared/src/validation/negotiation.ts  → v2: packages/shared/src/schemas/input/negotiation.input.ts
- v1: packages/shared/src/validation/common.ts       → v2: packages/shared/src/schemas/input/common.input.ts

IMPORTANT MODIFICATION to auth.input.ts after copying:
In the signupSchema and loginSchema, add email normalization:
- Change: `email: z.string().email().max(255).optional()`
- To: `email: z.string().email().max(255).transform(e => e.toLowerCase().trim()).optional()`
- For loginSchema email field, apply the same `.transform(e => e.toLowerCase().trim())`

COPY v1 tests verbatim:
- v1: packages/shared/src/__tests__/fsm.test.ts     → v2: packages/shared/src/__tests__/fsm.test.ts
- v1: packages/shared/src/__tests__/phone.test.ts   → v2: packages/shared/src/__tests__/phone.test.ts
- v1: packages/shared/src/__tests__/pricing.test.ts → v2: packages/shared/src/__tests__/pricing.test.ts
(Update import paths if the file locations changed, e.g., fsm.ts → fsm/order-status.ts)

CREATE NEW files (these don't exist in v1):

File: packages/shared/src/schemas/input/user.input.ts
Define Zod schemas:
- updateProfileInput: { name (optional, min 2, max 100), locale (optional, enum from enums.ts Locale values), avatar (optional, string url) }
- pushTokenInput: { token (string, min 1) }

File: packages/shared/src/schemas/input/pro.input.ts
- toggleAvailabilityInput: { available (boolean) }

File: packages/shared/src/schemas/input/admin.input.ts
Copy the admin-related schemas from v1's validation/orders.ts (adminStatusOverrideSchema, adminPriceOverrideSchema, adminUserToggleSchema) into this new file. Add:
- auditLogInput: { cursor (optional, string), limit (optional, number, default 50, max 100) }

File: packages/shared/src/schemas/output/user.output.ts
Define Zod schemas for API responses:
- userOutput: { id, email (nullable), phone (nullable), name, role, locale, isActive, createdAt }
- authOutput: { user (userOutput), accessToken, refreshToken }

File: packages/shared/src/schemas/output/order.output.ts
- orderSummaryOutput: { id, serviceType, status, scheduledAt, address, floorPrice (nullable), finalPrice (nullable), createdAt }
- orderDetailOutput: extends orderSummaryOutput with { detail, assignments (array), notes }
- orderListOutput: { items (array of orderSummaryOutput), nextCursor (nullable) }

File: packages/shared/src/schemas/output/negotiation.output.ts
- messageOutput: { id, orderId, senderId, senderName, content, seq, clientMessageId (nullable), createdAt }
- offerOutput: { id, orderId, senderId, senderName, amount, status, seq, createdAt }

File: packages/shared/src/schemas/output/pro.output.ts
- proProfileOutput: { id, userId, skills (array), zones (array), rating (nullable), reliability (nullable), isAvailable, isTeamLead, createdAt }
- assignmentOutput: { id, orderId, proId, role, status, confirmedAt (nullable) }

File: packages/shared/src/schemas/socket/client-events.ts
Define Zod schemas for each client-to-server socket event payload:
- roomJoinPayload: { orderId (string) }
- roomLeavePayload: { orderId (string) }
- messageSendPayload: { orderId (string), content (string, max 2000), clientMessageId (string, uuid) }
- offerCreatePayload: { orderId (string), amount (number, positive, multipleOf 5) }
- offerAcceptPayload: { orderId (string), offerId (string) }
- typingStartPayload: { orderId (string) }
- typingStopPayload: { orderId (string) }
- authRenewPayload: { token (string) }

File: packages/shared/src/schemas/socket/server-events.ts
Define Zod schemas for each server-to-client socket event payload:
- messageNewPayload: { id, orderId, senderId, senderName, content, seq, clientMessageId (nullable), createdAt }
- offerNewPayload: { id, orderId, senderId, senderName, amount, status, seq, createdAt }
- offerAcceptedPayload: { orderId, offerId, finalPrice }
- typingIndicatorPayload: { orderId, userId, userName, isTyping }
- statusUpdatePayload: { orderId, status, updatedAt }
- errorPayload: { code (string), message (string) }

File: packages/shared/src/types/socket-events.ts
Import z.infer<> from the socket Zod schemas above. Define and export:
- ClientToServerEvents interface: typed from client-events.ts schemas
- ServerToClientEvents interface: typed from server-events.ts schemas

File: packages/shared/src/errors/codes.ts
```typescript
export const ERROR_CODES = {
  // Auth: 001-099
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_EMAIL_EXISTS: 'AUTH_002',
  AUTH_PHONE_EXISTS: 'AUTH_003',
  AUTH_TOKEN_EXPIRED: 'AUTH_004',
  AUTH_TOKEN_INVALID: 'AUTH_005',
  AUTH_TOKEN_REVOKED: 'AUTH_006',
  AUTH_OTP_EXPIRED: 'AUTH_007',
  AUTH_OTP_INVALID: 'AUTH_008',
  AUTH_OTP_MAX_ATTEMPTS: 'AUTH_009',
  AUTH_OTP_RATE_LIMITED: 'AUTH_010',
  AUTH_FORBIDDEN: 'AUTH_011',
  AUTH_MISSING_IDENTIFIER: 'AUTH_012',

  // Order: 100-199
  ORDER_NOT_FOUND: 'ORDER_100',
  ORDER_INVALID_TRANSITION: 'ORDER_101',
  ORDER_ALREADY_CANCELLED: 'ORDER_102',
  ORDER_NOT_OWNED: 'ORDER_103',
  ORDER_ALREADY_RATED: 'ORDER_104',
  ORDER_NOT_COMPLETED: 'ORDER_105',
  ORDER_INVALID_SERVICE_DETAILS: 'ORDER_106',

  // Negotiation: 200-299
  NEG_ORDER_NOT_NEGOTIATING: 'NEG_200',
  NEG_OFFER_NOT_FOUND: 'NEG_201',
  NEG_OFFER_EXPIRED: 'NEG_202',
  NEG_OFFER_ALREADY_ACCEPTED: 'NEG_203',
  NEG_AMOUNT_OUT_OF_BOUNDS: 'NEG_204',
  NEG_AMOUNT_BAD_INCREMENT: 'NEG_205',
  NEG_MESSAGE_TOO_LONG: 'NEG_206',
  NEG_DUPLICATE_MESSAGE: 'NEG_207',

  // Pro: 300-399
  PRO_NOT_FOUND: 'PRO_300',
  PRO_NOT_AVAILABLE: 'PRO_301',
  PRO_ASSIGNMENT_NOT_FOUND: 'PRO_302',
  PRO_ASSIGNMENT_WRONG_STATUS: 'PRO_303',
  PRO_NOT_ASSIGNED: 'PRO_304',
  PRO_NOT_LEAD: 'PRO_305',
  PRO_ALREADY_JOINED: 'PRO_306',
  PRO_NO_OPEN_SLOTS: 'PRO_307',

  // Admin: 400-499
  ADMIN_USER_NOT_FOUND: 'ADMIN_400',

  // General: 900-999
  VALIDATION_ERROR: 'GEN_900',
  NOT_FOUND: 'GEN_901',
  INTERNAL_ERROR: 'GEN_999',
  RATE_LIMITED: 'GEN_902',
  IDEMPOTENCY_CONFLICT: 'GEN_903',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

File: packages/shared/src/schemas/index.ts
Barrel file: re-export all input/*, output/*, socket/* schemas.

File: packages/shared/src/fsm/index.ts
Barrel file re-exporting from order-status.ts.

File: packages/shared/src/errors/index.ts
Barrel file re-exporting from codes.ts.

File: packages/shared/src/index.ts
Main barrel: re-export everything from schemas, types, pricing, fsm, errors, phone.

=== STEP 3: Prisma schema (COPY FROM V1) ===

COPY verbatim from v1:
- v1: apps/api/prisma/schema.prisma → v2: apps/api/prisma/schema.prisma
- v1: apps/api/prisma/seed.ts      → v2: apps/api/prisma/seed.ts

The v1 schema is production-ready with:
- All 11+ models properly indexed
- Correct enum definitions
- Foreign keys with onDelete behavior
- Unique constraints for deduplication
- Cursor pagination indexes

ONLY modification to schema.prisma: Ensure these indexes exist (add if missing):
- Order: @@index([createdAt, id]) for compound cursor pagination
- AuditLog: @@index([createdAt, id]) for compound cursor pagination
These may already be present — check before adding.

File: apps/api/package.json
```json
{
  "name": "@babloo/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@babloo/shared": "workspace:*",
    "@prisma/client": "^6.0.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0",
    "typescript": "^5.7.0",
    "tsx": "^4.0.0"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

File: apps/api/tsconfig.json
```json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

File: apps/api/src/server.ts (placeholder)
```typescript
// Placeholder — implemented in Prompt 2
console.log('API server placeholder');
```

File: apps/mobile/package.json (placeholder)
```json
{
  "name": "@babloo/mobile",
  "version": "0.0.1",
  "private": true,
  "dependencies": {
    "@babloo/shared": "workspace:*"
  }
}
```

=== STEP 4: Install and verify ===

Run:
1. pnpm install
2. pnpm --filter @babloo/shared build
3. Verify no TypeScript errors
4. If Docker is available: docker compose up -d, then pnpm db:generate && pnpm db:migrate -- --name init

Constraints:
- The shared package MUST compile cleanly with zero TypeScript errors
- All copied v1 files must have their import paths updated to match the new directory structure
- Do NOT add any runtime frameworks (no Express, no Fastify, no React)
- Validate: `npx prisma validate --schema apps/api/prisma/schema.prisma` succeeds
- The "exports" field in shared/package.json must restrict deep imports

Validation criteria:
- `pnpm --filter @babloo/shared build` succeeds with no errors
- `npx prisma validate --schema apps/api/prisma/schema.prisma` succeeds
- v1 tests (fsm, pricing, phone) pass after import path updates
- Email normalization is present in auth schemas (toLowerCase + trim)

Commit message: "feat: scaffold monorepo with shared package (copied from v1), Prisma schema, and Docker Compose"
```

---

## Prompt 2 — API Foundation: Fastify + tRPC + Auth System

**Give to Codex:**

```
Context: Monorepo "babloo-v2" already set up (Prompt 1). The shared package (@babloo/shared) exists with Zod schemas, enums, error codes, pricing, and FSM — all copied from v1 (Bab-Lma). Prisma schema exists with all models.

IMPORTANT: Clone https://github.com/n0cap/Bab-Lma.git if not already available. You will copy the auth service from it.

Goal: Set up the API server with Fastify + tRPC, structured logging, env validation, and the complete authentication system.

=== STEP 1: Install API dependencies ===

Add to apps/api/package.json dependencies:
```json
{
  "dependencies": {
    "@babloo/shared": "workspace:*",
    "@prisma/client": "^6.0.0",
    "@trpc/server": "^11.0.0",
    "fastify": "^5.0.0",
    "@fastify/cors": "^10.0.0",
    "@fastify/helmet": "^13.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "ioredis": "^5.4.0",
    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.0",
    "@types/jsonwebtoken": "^9.0.0",
    "prisma": "^6.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.0.0"
  }
}
```

=== STEP 2: Env validation (WRITE FRESH) ===

File: apps/api/src/config/env.ts

Create a Zod schema that validates ALL environment variables at import time. If validation fails, log the errors and call process.exit(1).

Variables to validate:
- DATABASE_URL (string, starts with "postgresql://")
- REDIS_URL (string, default "redis://localhost:6379")
- JWT_SECRET (string, min 32 chars in production, default "dev-secret-change-me-min-32-chars!!" in development)
- JWT_ACCESS_TTL (string, default "15m")
- JWT_REFRESH_TTL (string, default "30d")
- BCRYPT_ROUNDS (number, default 12, min 10 in production)
- OTP_TTL_MINUTES (number, default 5)
- OTP_MAX_ATTEMPTS (number, default 5)
- OTP_RATE_LIMIT_PER_15MIN (number, default 3)
- SMS_PROVIDER (enum: "mock" | "twilio", default "mock")
- PORT (number, default 3000)
- NODE_ENV (enum: "development" | "production" | "test", default "development")
- CORS_ORIGINS (string, default "http://localhost:8081")
- SENTRY_DSN (optional string)

CRITICAL: In production (NODE_ENV=production), JWT_SECRET must NOT be the default value. Crash with a clear error message if it is.

Export the validated config object as `export const env = { ... }`.

=== STEP 3: Logger (WRITE FRESH) ===

File: apps/api/src/lib/logger.ts

Set up Pino logger:
- JSON format in production, pino-pretty in development
- Base fields: { service: 'babloo-api' }
- Redaction paths: ['req.headers.authorization', '*.password', '*.passwordHash', '*.token', '*.refreshToken', '*.codeHash', '*.hash', '*.otp', '*.code']
- Export: `export const logger = pino({ ... })`
- Export: `export function createChildLogger(bindings: Record<string, unknown>) { return logger.child(bindings); }`

=== STEP 4: Prisma client (WRITE FRESH) ===

File: apps/api/src/lib/prisma.ts
Singleton Prisma client. Log queries in development only. Export: `export const db = new PrismaClient({ ... })`

=== STEP 5: Redis client (WRITE FRESH) ===

File: apps/api/src/lib/redis.ts
ioredis singleton using env.REDIS_URL. Log connection events. Export: `export const redis = new Redis(env.REDIS_URL)`

=== STEP 6: Error classes (WRITE FRESH) ===

File: apps/api/src/lib/errors.ts

```typescript
import { TRPCError } from '@trpc/server';
import type { ErrorCode } from '@babloo/shared/errors';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly httpStatus: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toTRPCError(): TRPCError {
    const codeMap: Record<number, TRPCError['code']> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return new TRPCError({
      code: codeMap[this.httpStatus] ?? 'INTERNAL_SERVER_ERROR',
      message: this.message,
      cause: { code: this.code },
    });
  }
}

export class AuthError extends AppError {
  constructor(code: ErrorCode, message: string) { super(code, message, 401); }
}
export class ForbiddenError extends AppError {
  constructor(code: ErrorCode, message: string) { super(code, message, 403); }
}
export class NotFoundError extends AppError {
  constructor(code: ErrorCode, message: string) { super(code, message, 404); }
}
export class ValidationError extends AppError {
  constructor(code: ErrorCode, message: string) { super(code, message, 400); }
}
export class ConflictError extends AppError {
  constructor(code: ErrorCode, message: string) { super(code, message, 409); }
}
export class RateLimitError extends AppError {
  constructor(code: ErrorCode, message: string) { super(code, message, 429); }
}
```

=== STEP 7: tRPC setup (WRITE FRESH) ===

File: apps/api/src/trpc/index.ts
Initialize tRPC with context type: { db: PrismaClient, redis: Redis, user: { id: string, role: string } | null, requestId: string, logger: pino.Logger }
Error formatter that extracts AppError code from cause.

File: apps/api/src/trpc/context.ts
Create context function that takes Fastify request. Extracts requestId, creates child logger, extracts JWT from Authorization header, verifies it, returns { db, redis, user, requestId, logger }. If JWT invalid, user is null.

File: apps/api/src/trpc/middleware/auth.ts
- `isAuthenticated`: checks ctx.user is not null, throws UNAUTHORIZED if null. Narrows user type to non-null.

File: apps/api/src/trpc/middleware/role.ts
- `requireRole(role)`: checks ctx.user.role matches. Returns same context.

File: apps/api/src/trpc/middleware/logger.ts
Logs procedure start/end with { procedure, durationMs, requestId }.

File: apps/api/src/trpc/router.ts
Root router merging all domain routers. For now just auth. Export `appRouter` and `AppRouter` type.

=== STEP 8: Auth service (COPY FROM V1 + ADAPT) ===

COPY v1: apps/api/src/services/auth.service.ts → v2: apps/api/src/services/auth.service.ts

The v1 auth service is well-written. It handles:
- signup (email/phone, password hashing, professional creation for PRO role)
- login (email + password verification)
- otpRequest (rate limiting via DB, 6-digit OTP generation, bcrypt hashing)
- otpVerify (atomic verification with attempt limiting, TOCTOU prevention)
- refresh (token family rotation with reuse/theft detection)
- logout (family-wide revocation)
- logoutAll (revoke all user tokens)

REQUIRED MODIFICATIONS after copying:

1. CHANGE function signatures to accept deps as first argument (dependency injection for tRPC):
   - Old: `export async function signup(input: SignupInput)`
   - New: `export async function signup(deps: { db: PrismaClient, redis: Redis, logger: Logger }, input: SignupInput)`
   - Apply to ALL exported functions: signup, login, otpRequest, otpVerify, refresh, logout, logoutAll

2. REPLACE all `prisma.` calls with `deps.db.` (the v1 file imports a global Prisma singleton)

3. ADD email normalization on ALL email lookups (the v1 bug):
   - In signup: `const normalizedEmail = input.email?.toLowerCase().trim()`
   - In login: `const normalizedEmail = input.email.toLowerCase().trim()`
   - Use normalizedEmail for all findUnique/create operations

4. REPLACE `console.log/console.error` with `deps.logger.info/deps.logger.error`

5. REPLACE error throwing to use the new AppError classes:
   - `throw new Error('Invalid credentials')` → `throw new AuthError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Invalid credentials')`
   - Map all existing errors to appropriate AppError subclasses + error codes

6. IMPORT env config from '../config/env' instead of '../config'

7. KEEP all the following v1 logic exactly as-is (it's correct):
   - JWT token generation with issueAccessToken()
   - Refresh token family tracking with createRefreshToken()
   - bcrypt hashing for passwords and OTP codes
   - Token rotation theft detection (if revoked token reused → revoke entire family)
   - OTP rate limiting via DB-backed counter
   - Atomic OTP verification in transaction

Also COPY v1: apps/api/src/utils/jwt.ts → v2: apps/api/src/lib/jwt.ts
Update imports for the new config path.

=== STEP 9: Auth router (WRITE FRESH) ===

File: apps/api/src/routers/auth.router.ts

tRPC router with procedures:
- signup: publicProcedure, input: signupSchema (from @babloo/shared), calls authService.signup(deps, input)
- login: publicProcedure, input: loginSchema, calls authService.login(deps, input)
- otpRequest: publicProcedure, input: otpRequestSchema, calls authService.otpRequest(deps, input)
- otpVerify: publicProcedure, input: otpVerifySchema, calls authService.otpVerify(deps, input)
- refresh: publicProcedure, input: refreshSchema, calls authService.refresh(deps, input)
- logout: protectedProcedure (isAuthenticated), input: refreshSchema, calls authService.logout(deps, ctx.user.id, input.refreshToken)
- logoutAll: protectedProcedure, calls authService.logoutAll(deps, ctx.user.id)

Where `deps` = { db: ctx.db, redis: ctx.redis, logger: ctx.logger }

=== STEP 10: Server setup (WRITE FRESH) ===

File: apps/api/src/server.ts

1. Create Fastify instance with Pino logger
2. Register @fastify/cors with origins from env
3. Register @fastify/helmet
4. Register tRPC Fastify plugin at /trpc
5. GET /healthz → { status: 'ok' } (liveness)
6. GET /readyz → check db.$queryRaw`SELECT 1` and redis.ping() (readiness)
7. Listen on env.PORT, bind 0.0.0.0
8. Graceful shutdown on SIGTERM/SIGINT

=== STEP 11: Tests (ADAPT FROM V1) ===

COPY v1 test structure but adapt for tRPC:

File: apps/api/tests/setup.ts
Set up Vitest with test database (TestContainers for PostgreSQL + Redis).

File: apps/api/tests/helpers.ts
- createTestCaller(): creates tRPC caller with test context (use createCallerFactory from tRPC)
- createTestUser(overrides): creates user in DB, returns user + tokens
- mockContext(user?): creates test tRPC context

File: apps/api/tests/routers/auth.router.test.ts

REFERENCE v1: apps/api/src/__tests__/auth.routes.test.ts for test case ideas, but rewrite for tRPC:
- signup with email succeeds, returns tokens
- signup with phone succeeds
- signup with existing email returns CONFLICT
- signup with no email or phone returns BAD_REQUEST
- login with correct credentials returns tokens
- login with wrong password returns UNAUTHORIZED
- login normalizes email to lowercase (NEW TEST — verify "CLIENT@Babloo.Test" works)
- OTP request succeeds
- OTP verify with correct code returns tokens
- OTP verify with wrong code returns error
- refresh with valid token returns new tokens
- refresh with revoked token revokes entire family (theft detection)
- logout revokes the specific token
- logoutAll revokes all tokens for user

Constraints:
- Services receive dependencies via function arguments — no global singletons
- All errors use AppError subclasses with ERROR_CODES — never throw plain Error
- JWT secret comes from env.ts — never hardcoded
- Email is ALWAYS normalized to lowercase before any DB operation
- Refresh tokens are NEVER stored in plaintext — only hashed
- OTP codes are NEVER stored in plaintext — only hashed
- tRPC router type (AppRouter) must be exported for the mobile app to import

Validation criteria:
- `pnpm --filter @babloo/api build` succeeds
- All auth tests pass
- Server starts and /healthz returns 200
- Login with "CLIENT@Babloo.Test" works if signup was "client@babloo.test"
- Refresh token rotation detects theft

Commit message: "feat(api): Fastify + tRPC server with auth system (adapted from v1), structured logging, and env validation"
```

---

## Prompt 3 — API: Orders + Pricing + Matching

**Give to Codex:**

```
Context: Monorepo "babloo-v2" with shared package and API server (Prompts 1-2). Auth system works. tRPC initialized.

IMPORTANT: Clone https://github.com/n0cap/Bab-Lma.git if not already available.

Goal: Add order management, pricing, and matching. Most business logic comes from v1.

=== STEP 1: Pricing service (COPY FROM V1) ===

The pricing logic is already in @babloo/shared/pricing (copied in Prompt 1). Create a thin service wrapper:

File: apps/api/src/services/pricing.service.ts
- estimatePrice(serviceType, detail): calls computePrice from @babloo/shared/pricing, returns { floorPrice, ceilingPrice }
- Use NEGOTIATION_CEILING_MULTIPLIER from shared pricing constants for ceiling calculation

=== STEP 2: Order service (COPY FROM V1 + ADAPT) ===

COPY v1: apps/api/src/services/order.service.ts → v2: apps/api/src/services/order.service.ts

REQUIRED MODIFICATIONS:

1. CHANGE function signatures to accept deps: { db, logger }
2. REPLACE all `prisma.` with `deps.db.`
3. REPLACE `console.log/error` with `deps.logger.info/error`
4. FIX `as any` casts (lines ~32, 37, 40 in v1):
   - `serviceType as any` → use proper Prisma enum type
   - `status as any` → use proper OrderStatus type from Prisma
5. REPLACE error throwing with AppError subclasses + ERROR_CODES
6. REPLACE the lazy import of negotiation.service (circular dep in v1) with proper dependency injection
7. REPLACE fire-and-forget notification calls (`.catch(console.error)`) with BullMQ job enqueuing (will be wired in Prompt 5, for now just add a TODO comment)

KEEP these v1 patterns exactly (they're correct):
- buildDetailData() for polymorphic order details
- extractPricingParams() for price calculation
- Cursor pagination with nextCursor
- FSM validation via canTransition from shared
- StatusEvent creation with auto-incrementing seq
- Rating update with weighted average calculation

=== STEP 3: Matching service (COPY FROM V1 + ADAPT) ===

COPY v1: apps/api/src/services/matching.service.ts → v2: apps/api/src/services/matching.service.ts

MODIFICATIONS:
1. Change function signatures to accept deps: { db, logger }
2. Replace `prisma.` with `deps.db.`
3. Fix `as any` cast on line ~37 to use proper typing
4. Replace console.log with deps.logger

KEEP the v1 matching logic exactly:
- Zone normalization (normalizeToken)
- Skill matching
- Team lead requirement
- Sort by reliability then rating
- Heuristic fallback for team detection

=== STEP 4: Order router (WRITE FRESH) ===

File: apps/api/src/routers/order.router.ts

tRPC router:
- create: protectedProcedure + requireRole(CLIENT), input: createOrderSchema (from shared)
  - Create order, submit, start matching, return order
- list: protectedProcedure, input: { cursor?: string, limit?: number }
- byId: protectedProcedure, input: { orderId: string }
- cancel: protectedProcedure + requireRole(CLIENT), input: { orderId: string }
- updateStatus: protectedProcedure + requireRole(PRO), input: { orderId: string, status: OrderStatus }
- rate: protectedProcedure + requireRole(CLIENT), input: { orderId: string, ...ratingSchema }

=== STEP 5: Pricing router (WRITE FRESH) ===

File: apps/api/src/routers/pricing.router.ts
- estimate: publicProcedure, input: pricingEstimateSchema (from shared), returns { floorPrice, ceilingPrice }

=== STEP 6: Update root router ===
Add order and pricing routers.

=== STEP 7: Tests (ADAPT FROM V1) ===

REFERENCE v1: apps/api/src/__tests__/order.routes.test.ts and order-lifecycle.routes.test.ts for test cases.
Rewrite for tRPC callers.

Test cases:
- Create menage order calculates correct floor price
- Create cuisine order with 5 guests = correct price
- List orders returns paginated results with correct cursor
- Get order by id returns detail
- Cancel order transitions to CANCELLED
- Cancel completed order fails (ORDER_101)
- Rate completed order succeeds
- Rate order twice fails (conflict)
- Pro updates status through valid transitions
- Pro cannot skip statuses

Also reference v1: apps/api/src/__tests__/pricing.routes.test.ts for pricing tests.

Constraints:
- Order status transitions MUST use canTransition() from shared FSM
- Cursor pagination uses (createdAt, id) compound cursor
- All mutations use Prisma transactions
- seq for StatusEvent is server-assigned: MAX(seq) + 1 in transaction

Validation criteria:
- All order and pricing tests pass
- Invalid FSM transitions return ORDER_101 error code

Commit message: "feat(api): order CRUD with FSM lifecycle and pricing (adapted from v1)"
```

---

## Prompt 4 — API: Real-time (Socket.IO) + Negotiation

**Give to Codex:**

```
Context: Monorepo "babloo-v2" with auth and orders (Prompts 1-3).

IMPORTANT: Clone https://github.com/n0cap/Bab-Lma.git if not already available.

Goal: Add Socket.IO for real-time messaging and the negotiation system. The negotiation service is copied from v1 (it's one of the cleanest services). Socket.IO setup is written fresh with typed events and Redis adapter.

=== STEP 1: Install dependencies ===
Add to apps/api/package.json:
- socket.io: ^4.8.0
- @socket.io/redis-adapter: ^8.3.0

=== STEP 2: Negotiation service (COPY FROM V1 AS-IS) ===

COPY v1: apps/api/src/services/negotiation.service.ts → v2: apps/api/src/services/negotiation.service.ts

This service is the cleanest in v1. It handles:
- checkParticipant(): verifies user is client or assigned pro
- sendMessage(): with seq assignment and clientMessageId deduplication
- createOffer(): with amount validation (floor/ceiling bounds, multiple of 5)
- acceptOffer(): atomic transaction — accept offer, reject others, set finalPrice, transition order
- listMessages(): seq-based pagination
- listOffers(): standard query
- poll(): multiplexed polling for messages + offers + status events

MODIFICATIONS (minimal):
1. Change function signatures to accept deps: { db, logger }
2. Replace `prisma.` with `deps.db.`
3. Replace console.log/error with deps.logger
4. Replace error throwing with AppError + ERROR_CODES
5. Keep CEILING_MULTIPLIER (2.5) and OFFER_STEP (5) — these match v1 shared pricing

=== STEP 3: Socket.IO setup (WRITE FRESH — this is new in v2) ===

File: apps/api/src/socket/setup.ts
- Attach Socket.IO to Fastify's underlying HTTP server
- Configure Redis adapter (create pub + sub Redis connections)
- CORS: same origins as Fastify
- Use typed events from @babloo/shared/types/socket-events

File: apps/api/src/socket/auth.ts
Socket middleware: extract token from handshake.auth.token, verify JWT, attach user to socket.data, reject if invalid.

File: apps/api/src/socket/handlers/message.handler.ts
Handle 'message:send':
- Zod safeParse payload using messageSendPayload from @babloo/shared
- Call negotiation.sendMessage()
- Broadcast 'message:new' to order room

File: apps/api/src/socket/handlers/offer.handler.ts
Handle 'offer:create':
- Zod safeParse, call negotiation.createOffer()
- Broadcast 'offer:new'

Handle 'offer:accept':
- Zod safeParse, call negotiation.acceptOffer()
- Broadcast 'offer:accepted' with finalPrice

File: apps/api/src/socket/handlers/typing.handler.ts
Handle 'typing:start'/'typing:stop':
- Zod safeParse, broadcast 'typing:indicator'

REFERENCE v1: apps/api/src/socket/handlers.ts for the event handling patterns, but rewrite with:
- Zod validation on every incoming payload (v1 trusts payloads)
- Redis-backed rate limiting per event per user
- Structured error logging with correlationId

=== STEP 4: Negotiation router (WRITE FRESH) ===

File: apps/api/src/routers/negotiation.router.ts
tRPC router (HTTP fallback for socket):
- messages: protectedProcedure, input: { orderId, beforeSeq?, limit? }
- sendMessage: protectedProcedure, input: { orderId, content, clientMessageId }
- offers: protectedProcedure, input: { orderId }
- createOffer: protectedProcedure, input: { orderId, amount }
- acceptOffer: protectedProcedure, input: { orderId, offerId }
- poll: protectedProcedure, input: { orderId, afterSeq? }

=== STEP 5: Integrate Socket.IO with server, update root router ===

=== STEP 6: Tests (ADAPT FROM V1) ===

REFERENCE v1: apps/api/src/__tests__/negotiation.routes.test.ts
Rewrite for tRPC callers. Test:
- Send message with correct seq
- Duplicate clientMessageId is idempotent
- Message in non-negotiating order fails
- Create offer in bounds succeeds
- Create offer outside bounds fails (NEG_204)
- Non-multiple-of-5 fails (NEG_205)
- Accept offer sets finalPrice
- Accept own offer fails
- Seq pagination works
- Poll returns items after given seq

Constraints:
- ALL socket payloads are Zod safeParsed
- seq is server-assigned in transaction
- Redis adapter for Socket.IO scaling
- Rate limiting: 30 messages/min, 5 offers/min per user

Commit message: "feat(api): Socket.IO with Redis adapter, negotiation system (adapted from v1), and polling fallback"
```

---

## Prompt 5 — API: Pro Management + Admin + Background Jobs

**Give to Codex:**

```
Context: Monorepo "babloo-v2" with full API except pro/admin (Prompts 1-4).

IMPORTANT: Clone https://github.com/n0cap/Bab-Lma.git if not already available.

Goal: Add pro management, admin endpoints, push notification jobs, and user profile management.

=== STEP 1: Install BullMQ ===
Add: bullmq: ^5.0.0

=== STEP 2: Job queue setup (WRITE FRESH) ===

File: apps/api/src/jobs/queue.ts — BullMQ queue setup
File: apps/api/src/jobs/notification.job.ts — Push notification processor

File: apps/api/src/jobs/cleanup.job.ts — Expired token/OTP/idempotency cleanup

=== STEP 3: Notification service (COPY FROM V1 + ADAPT) ===

COPY v1: apps/api/src/services/notification.service.ts → v2: apps/api/src/services/notification.service.ts

MODIFICATIONS:
1. Change signatures to accept deps: { db, logger }
2. Replace `prisma.` with `deps.db.`
3. REPLACE the inline Expo push API calls with BullMQ job enqueuing:
   - Old: `await fetch('https://exp.host/--/api/v2/push/send', ...)`
   - New: `await notificationQueue.add('push', { userId, title, body, data, correlationId }, { jobId: dedup key })`
   Move the actual Expo API call logic into jobs/notification.job.ts
4. REMOVE scheduleServiceReminder() — the setTimeout-based approach won't survive restarts. Replace with a BullMQ delayed job.
5. KEEP: token cleanup logic (removePushToken on DeviceNotRegistered)
6. KEEP: notification message templates (notifyNewMessage, notifyStatusChange, etc.)

=== STEP 4: Admin service (COPY FROM V1 AS-IS) ===

COPY v1: apps/api/src/services/admin.service.ts → v2: apps/api/src/services/admin.service.ts

MODIFICATIONS (minimal):
1. Change signatures to accept deps: { db, logger }
2. Replace `prisma.` with `deps.db.`
3. Fix `as any` casts (lines ~21, 29) with proper Prisma enum types
4. Replace error throwing with AppError + ERROR_CODES

The v1 admin service is clean: overrideOrderStatus, overrideOrderPrice, toggleUserActive, getAuditLog. All create proper AuditLog entries.

=== STEP 5: Pro service (WRITE FRESH — v1 pro logic is in routes, not a service) ===

In v1, pro business logic is mixed into pro.routes.ts. For v2, extract it into a proper service.

File: apps/api/src/services/pro.service.ts

REFERENCE v1: apps/api/src/routes/pro.routes.ts for the business logic, but write it as clean service functions:

1. getProfile(deps, userId)
2. toggleAvailability(deps, userId, available)
3. getProOrders(deps, userId, input) — cursor pagination
4. getOpenSlots(deps)
5. createJoinRequest(deps, orderId, userId)
6. getJoinRequests(deps, orderId, userId) — verify LEAD role
7. approveAssignment(deps, assignmentId, userId)
8. rejectAssignment(deps, assignmentId, userId)
9. confirmAssignment(deps, assignmentId, userId) — notify client
10. declineAssignment(deps, assignmentId, userId)

=== STEP 6: Routers (WRITE FRESH) ===

File: apps/api/src/routers/pro.router.ts — all requireRole(PRO)
File: apps/api/src/routers/admin.router.ts — all requireRole(ADMIN)
File: apps/api/src/routers/user.router.ts — me, updateProfile, push token registration

=== STEP 7: Wire notifications ===
Update order, negotiation, and pro services to enqueue notification jobs after key events.

=== STEP 8: Start workers, update root router, graceful shutdown ===

=== STEP 9: Tests (ADAPT FROM V1) ===

REFERENCE v1: apps/api/src/__tests__/admin.routes.test.ts
Rewrite for tRPC. Add pro and user tests.

Constraints:
- Push notifications go through BullMQ — never inline
- Admin status override bypasses FSM but creates AuditLog
- Jobs carry correlationId
- BullMQ jobs have idempotent jobIds

Commit message: "feat(api): pro management, admin panel (adapted from v1), and BullMQ notification jobs"
```

---

## Prompt 6 — Mobile Foundation: Expo Router + Providers + Auth Screens

**Give to Codex:**

```
Context: Monorepo "babloo-v2" with complete API (Prompts 1-5). The API exports AppRouter type.

IMPORTANT: Clone https://github.com/n0cap/Bab-Lma.git if not already available.

Goal: Set up Expo mobile app with Expo Router, all providers, design system, and auth screens.

=== STEP 1: Create Expo app (WRITE FRESH) ===
Set up apps/mobile as Expo Router project with standard config.

Key dependencies:
- expo, expo-router, expo-secure-store, expo-notifications, expo-localization
- react, react-native
- @trpc/client, @trpc/react-query, @tanstack/react-query
- socket.io-client, i18next, react-i18next, zod
- @babloo/shared: workspace:*

=== STEP 2: Theme (COPY FROM V1 AS-IS) ===

COPY verbatim from v1:
- v1: apps/mobile/src/theme/colors.ts    → v2: apps/mobile/src/constants/theme/colors.ts
- v1: apps/mobile/src/theme/typography.ts → v2: apps/mobile/src/constants/theme/typography.ts
- v1: apps/mobile/src/theme/spacing.ts   → v2: apps/mobile/src/constants/theme/spacing.ts
- v1: apps/mobile/src/theme/index.ts     → v2: apps/mobile/src/constants/theme/index.ts

These are pure constants with no framework dependencies. The color palette (navy, clay, surface, etc.), typography scale (Fraunces headings, DM Sans body), and spacing system are all production-ready.

=== STEP 3: UI Components (COPY FROM V1 + MINOR EDITS) ===

COPY from v1:
- v1: apps/mobile/src/components/Button.tsx → v2: apps/mobile/src/components/ui/Button.tsx
- v1: apps/mobile/src/components/Input.tsx  → v2: apps/mobile/src/components/ui/Input.tsx
- v1: apps/mobile/src/components/Card.tsx   → v2: apps/mobile/src/components/ui/Card.tsx

MODIFICATIONS:
1. Update theme import paths (old: '../../theme' → new: '../../constants/theme')
2. For Input.tsx: ensure autoCapitalize prop is accepted and forwarded to TextInput (the v1 current branch already has this fix)
3. Keep all variant/style logic as-is — it's clean and well-designed

Also create fresh (don't exist in v1):
- apps/mobile/src/components/ui/Badge.tsx — status badges with color variants
- apps/mobile/src/components/ui/LoadingScreen.tsx — full-screen ActivityIndicator
- apps/mobile/src/components/ui/ErrorView.tsx — error message + retry button

=== STEP 4: Lib files (PARTIALLY COPY) ===

File: apps/mobile/src/lib/trpc.ts (WRITE FRESH)
```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@babloo/api/src/trpc/router';
export const trpc = createTRPCReact<AppRouter>();
```

File: apps/mobile/src/lib/storage.ts (COPY FROM V1 + RENAME)
COPY v1: apps/mobile/src/services/secureStore.ts → v2: apps/mobile/src/lib/storage.ts
The v1 SecureStore wrapper is clean. Keep as-is.

File: apps/mobile/src/lib/socket.ts (WRITE FRESH)
Socket.IO client with typed events from @babloo/shared. Factory function createSocket(token). Auto-reconnect with exponential backoff.

File: apps/mobile/src/lib/i18n.ts (COPY FROM V1 + ADAPT)
COPY v1: apps/mobile/src/i18n/index.ts → v2: apps/mobile/src/lib/i18n.ts
Update to support multiple locales (FR, AR, EN). v1 only has FR fully implemented.

=== STEP 5: i18n Translations (COPY FROM V1) ===

COPY v1: apps/mobile/src/i18n/fr.json → v2: apps/mobile/assets/locales/fr.json

The v1 French translations are complete (150+ keys covering all screens). Copy as-is.

CREATE fresh:
- apps/mobile/assets/locales/en.json — English translations (translate from fr.json)
- apps/mobile/assets/locales/ar.json — Arabic translations (translate from fr.json)

=== STEP 6: Providers (WRITE FRESH) ===

These need to be rewritten for tRPC (v1 uses Axios/React Navigation):

File: apps/mobile/src/providers/AuthProvider.tsx
Auth state machine: 'loading' | 'authenticated' | 'unauthenticated'
- On mount: restore tokens from SecureStore, verify JWT, refresh if expired
- Single-flight token refresh
- Provides: state, user, login, signup, loginWithOtp, logout, token

REFERENCE v1: apps/mobile/src/contexts/AuthContext.tsx for the state management patterns (token storage, refresh logic, user hydration). The v1 AuthContext is well-designed — adapt its state machine for tRPC.

File: apps/mobile/src/providers/TRPCProvider.tsx
httpBatchLink → API_URL/trpc. Authorization header from AuthProvider. 401 → trigger refresh.

File: apps/mobile/src/providers/SocketProvider.tsx
REFERENCE v1: apps/mobile/src/contexts/SocketContext.tsx for socket lifecycle.
Add: reconnect/rejoin logic, auth:renew on token refresh, app background/foreground handling.

File: apps/mobile/src/providers/I18nProvider.tsx

=== STEP 7: Root layout + Auth screens (WRITE FRESH) ===

File: apps/mobile/app/_layout.tsx — providers wrapper, auth gate
File: apps/mobile/app/index.tsx — redirect based on auth + role
File: apps/mobile/app/(auth)/_layout.tsx — stack navigator
File: apps/mobile/app/(auth)/index.tsx — entry screen
File: apps/mobile/app/(auth)/sign-in-email.tsx
File: apps/mobile/app/(auth)/sign-in-phone.tsx
File: apps/mobile/app/(auth)/sign-up-email.tsx
File: apps/mobile/app/(auth)/sign-up-phone.tsx
File: apps/mobile/app/(auth)/otp.tsx
File: apps/mobile/app/(auth)/forgot-password.tsx

REFERENCE v1 screen files for UI layout and form logic:
- v1: apps/mobile/src/screens/auth/SignInEmailScreen.tsx
- v1: apps/mobile/src/screens/auth/SignUpEmailScreen.tsx
- v1: apps/mobile/src/screens/auth/OtpScreen.tsx
- etc.

The v1 screens have good UX (form validation, error display, navigation). Adapt the UI code for Expo Router navigation (replace `navigation.navigate('Screen')` with `router.push('/path')`).

Constraints:
- AuthProvider MUST block navigation until auth resolves
- Token refresh MUST be single-flight
- Email inputs MUST have autoCapitalize="none"
- All forms validate with Zod schemas from @babloo/shared
- Theme colors/typography from copied v1 theme

Commit message: "feat(mobile): Expo Router with auth flow, tRPC + Socket.IO providers, design system (theme from v1)"
```

---

## Prompt 7 — Mobile: Client Booking + Order Management

**Give to Codex:**

```
Context: Expo mobile app with auth flow and design system (Prompt 6).

IMPORTANT: Clone https://github.com/n0cap/Bab-Lma.git if not already available.

Goal: Build client booking flow and order management. Reference v1 screens for UI design.

=== STEP 1: Hooks (WRITE FRESH — v1 uses Axios, v2 uses tRPC) ===

File: apps/mobile/src/hooks/orders/useOrderQueries.ts
- useOrders(cursor?): trpc.order.list.useInfiniteQuery
- useOrder(orderId): trpc.order.byId.useQuery

File: apps/mobile/src/hooks/orders/useOrderMutations.ts
- useCreateOrder(), useCancelOrder(), useRateOrder()
- Each owns optimistic updates and cache invalidation

File: apps/mobile/src/hooks/orders/useOrderSocket.ts
- Subscribe to 'status:update' for orderId
- Update query cache on status change

=== STEP 2: Components (PARTIALLY COPY FROM V1) ===

File: apps/mobile/src/components/order/OrderCard.tsx
REFERENCE v1: apps/mobile/src/components/OrderCard.tsx (if exists) or v1 OrdersListScreen for the card layout.
Adapt for tRPC data shapes.

File: apps/mobile/src/components/order/StatusBadge.tsx — color-coded status badges
File: apps/mobile/src/components/order/PriceDisplay.tsx — floor/final price display

=== STEP 3: Client tabs + screens ===

File: apps/mobile/app/(client)/_layout.tsx
File: apps/mobile/app/(client)/(tabs)/_layout.tsx — bottom tabs: Home, Orders, Profile
File: apps/mobile/app/(client)/(tabs)/index.tsx — HomeScreen

REFERENCE v1: apps/mobile/src/screens/HomeScreen.tsx for layout

File: apps/mobile/app/(client)/(tabs)/orders.tsx — OrdersListScreen
REFERENCE v1: apps/mobile/src/screens/orders/OrdersListScreen.tsx

File: apps/mobile/app/(client)/(tabs)/profile.tsx — ProfileScreen
REFERENCE v1: apps/mobile/src/screens/ProfileScreen.tsx

=== STEP 4: Booking flow ===

File: apps/mobile/app/(client)/booking/service.tsx
REFERENCE v1: apps/mobile/src/screens/booking/ServiceSelectionScreen.tsx

File: apps/mobile/app/(client)/booking/details.tsx
REFERENCE v1: apps/mobile/src/screens/booking/ServiceDetailScreen.tsx — dynamic form by serviceType

File: apps/mobile/app/(client)/booking/search.tsx
REFERENCE v1: apps/mobile/src/screens/booking/SearchScreen.tsx

File: apps/mobile/app/(client)/booking/confirm.tsx
File: apps/mobile/app/(client)/booking/confirmed.tsx

=== STEP 5: Order detail ===

File: apps/mobile/app/(client)/order/[id].tsx
REFERENCE v1: apps/mobile/src/screens/orders/OrderDetailScreen.tsx

Constraints:
- All data via tRPC hooks, not Axios
- Navigation via Expo Router (router.push), not React Navigation
- Zod validation on forms
- Cursor pagination for order list

Commit message: "feat(mobile): client booking flow and order management (UI adapted from v1)"
```

---

## Prompt 8 — Mobile: Chat + Negotiation

**Give to Codex:**

```
Context: Expo mobile app with client flow (Prompts 6-7).

IMPORTANT: Clone https://github.com/n0cap/Bab-Lma.git if not already available.

Goal: Build real-time chat with negotiation. Reference v1 chat components for UI.

=== STEP 1: Negotiation hooks (WRITE FRESH — tRPC based) ===

File: apps/mobile/src/hooks/negotiation/useMessages.ts
File: apps/mobile/src/hooks/negotiation/useOffers.ts
File: apps/mobile/src/hooks/negotiation/useChatSocket.ts

REFERENCE v1 hooks for business logic patterns:
- v1: apps/mobile/src/services/queries/negotiation.ts
- v1: apps/mobile/src/services/mutations/negotiation.ts
- v1: apps/mobile/src/hooks/useSocketEvents.ts
Adapt from Axios/socket raw events to tRPC + typed socket events.

=== STEP 2: Chat components (REFERENCE V1) ===

File: apps/mobile/src/components/chat/MessageBubble.tsx
File: apps/mobile/src/components/chat/NegotiationBar.tsx
File: apps/mobile/src/components/chat/TypingIndicator.tsx
File: apps/mobile/src/components/chat/MessageInput.tsx

REFERENCE v1: apps/mobile/src/screens/chat/ChatScreen.tsx for the chat UI layout and component structure. The v1 ChatScreen contains inline components that should be extracted into the files above.

=== STEP 3: Chat screens ===

File: apps/mobile/app/(client)/order/chat.tsx
File: apps/mobile/app/(pro)/order/chat.tsx

Both reference v1: apps/mobile/src/screens/chat/ChatScreen.tsx

Key features to preserve from v1:
- FlatList inverted for messages
- Seq-based pagination (load older on scroll up)
- clientMessageId for deduplication
- NegotiationBar with offer bounds
- Typing indicators with debounce
- Socket disconnect → polling fallback

Constraints:
- Socket events update React Query cache, not local state
- Typing debounced at 500ms
- Offer amounts validated with isValidOfferAmount from @babloo/shared
- Offline fallback polls via tRPC every 5s

Commit message: "feat(mobile): real-time chat with negotiation (UI adapted from v1)"
```

---

## Prompt 9 — Mobile: Pro Screens

**Give to Codex:**

```
Context: Expo mobile app with client flow and chat (Prompts 6-8).

IMPORTANT: Clone https://github.com/n0cap/Bab-Lma.git if not already available.

Goal: Build pro-side screens. Reference v1 pro screens for UI.

=== STEP 1: Pro hooks (WRITE FRESH — tRPC based) ===

File: apps/mobile/src/hooks/pro/useProQueries.ts
File: apps/mobile/src/hooks/pro/useProMutations.ts
File: apps/mobile/src/hooks/pro/useProSocket.ts

REFERENCE v1 for business logic:
- v1: apps/mobile/src/services/queries/pro.ts
- v1: apps/mobile/src/services/queries/proProfile.ts
- v1: apps/mobile/src/services/queries/proOpenSlots.ts
- v1: apps/mobile/src/services/queries/proJoinRequests.ts
- v1: apps/mobile/src/services/mutations/pro.ts
- v1: apps/mobile/src/services/mutations/proAssignment.ts
- v1: apps/mobile/src/services/mutations/proAvailability.ts
- v1: apps/mobile/src/services/mutations/proApproveReject.ts
- v1: apps/mobile/src/services/mutations/proJoinRequest.ts

=== STEP 2: Pro screens ===

File: apps/mobile/app/(pro)/_layout.tsx
File: apps/mobile/app/(pro)/(tabs)/_layout.tsx — tabs: Home, Orders, Profile
File: apps/mobile/app/(pro)/(tabs)/index.tsx
REFERENCE v1: apps/mobile/src/screens/pro/ProHomeScreen.tsx

File: apps/mobile/app/(pro)/(tabs)/orders.tsx
REFERENCE v1: apps/mobile/src/screens/pro/ProOrdersScreen.tsx (if exists)

File: apps/mobile/app/(pro)/(tabs)/profile.tsx
REFERENCE v1: apps/mobile/src/screens/pro/ProProfileScreen.tsx

File: apps/mobile/app/(pro)/order/[id].tsx
REFERENCE v1: apps/mobile/src/screens/pro/ProOrderDetailScreen.tsx

File: apps/mobile/app/(pro)/order/offers.tsx
REFERENCE v1: apps/mobile/src/screens/pro/OffersScreen.tsx

Constraints:
- Share components with client (OrderCard, StatusBadge, etc.)
- Status updates via tRPC mutations
- Availability toggle prominent on home + profile

Commit message: "feat(mobile): pro dashboard and order management (UI adapted from v1)"
```

---

## Prompt 10 — Mobile: Tracking, Rating, i18n, Push Notifications

**Give to Codex:**

```
Context: Expo mobile app with all screens (Prompts 6-9). Final prompt.

IMPORTANT: Clone https://github.com/n0cap/Bab-Lma.git if not already available.

Goal: Build remaining features: status tracking, rating, push notifications, complete i18n.

=== STEP 1: Status tracking (REFERENCE V1) ===

File: apps/mobile/app/(client)/order/tracking.tsx
REFERENCE v1: apps/mobile/src/screens/orders/StatusTrackingScreen.tsx
- Visual timeline of status transitions
- Real-time updates via socket
- Pro info card when EN_ROUTE/IN_PROGRESS

=== STEP 2: Rating (REFERENCE V1) ===

File: apps/mobile/app/(client)/order/rating.tsx
REFERENCE v1: apps/mobile/src/screens/orders/RatingScreen.tsx
- Star rating (1-5), comment, submit

=== STEP 3: Push notifications (REFERENCE V1) ===

File: apps/mobile/src/hooks/usePushNotifications.ts
REFERENCE v1: apps/mobile/src/services/notifications.ts
- Request permissions, get Expo push token
- Register/unregister via tRPC (not Axios)
- Handle incoming notifications, navigate on tap

=== STEP 4: i18n (COPY FR FROM V1 + CREATE EN/AR) ===

v1 fr.json was already copied in Prompt 6.
Ensure en.json and ar.json are complete translations.

=== STEP 5: Home enhancements ===

Update client home: "Track your pro" banner when order is active
Update pro home: pending assignment badges

=== STEP 6: Error boundary ===
File: apps/mobile/src/components/ui/ErrorBoundary.tsx
Wrap route groups.

=== STEP 7: Config ===
File: apps/mobile/src/constants/config.ts — API_URL, timeouts, etc.

Commit message: "feat(mobile): status tracking, rating, push notifications, i18n (FR from v1)"
```

---

## Summary: What's Copied vs Written Fresh

| Area | Copied from v1 | Written fresh |
|------|----------------|---------------|
| **Shared types/enums** | 100% | — |
| **FSM** | 100% | — |
| **Pricing** | 100% | — |
| **Phone utils** | 100% | — |
| **Zod schemas** | ~80% (+ email fix) | Output schemas, socket schemas, error codes |
| **Prisma schema** | 100% | — |
| **Seed data** | 100% | — |
| **Auth service** | ~90% (+ deps injection + email fix) | — |
| **Negotiation service** | ~95% (+ deps injection) | — |
| **Admin service** | ~95% (+ deps injection) | — |
| **Matching service** | ~95% (+ deps injection) | — |
| **Order service** | ~85% (+ deps + type fixes) | — |
| **Notification service** | ~70% (+ BullMQ migration) | Job queue setup |
| **Theme** | 100% | — |
| **i18n (FR)** | 100% | EN + AR translations |
| **UI components** | Button, Card, Input (100%) | Badge, LoadingScreen, ErrorView |
| **SecureStore wrapper** | 100% | — |
| **Monorepo scaffolding** | — | Turborepo, Docker Compose |
| **Env validation** | — | 100% fresh |
| **Logger (Pino)** | — | 100% fresh |
| **tRPC setup** | — | 100% fresh |
| **Error classes** | — | 100% fresh |
| **Socket.IO (typed + Redis)** | — | 100% fresh |
| **BullMQ jobs** | — | 100% fresh |
| **Expo Router** | — | 100% fresh |
| **Providers** | — | 100% fresh (reference v1 patterns) |
| **tRPC hooks** | — | 100% fresh (reference v1 Axios hooks) |
| **All route files** | — | 100% fresh |

**Estimated token savings:** ~40-50% per prompt by copying v1 code instead of generating from scratch.

---

## Post-Rebuild Checklist

After all 10 prompts are executed, verify:

1. **End-to-end type safety:** Change a field in shared schema → both API and mobile show TS errors
2. **Full feature parity:** Every v1 feature exists in v2
3. **No hardcoded secrets:** env.ts validates at boot
4. **Structured logging:** correlationId in every log line
5. **Socket resilience:** Disconnect → poll → reconnect → resume real-time
6. **Token rotation:** Reuse refresh token → entire family revoked
7. **Rate limiting:** Spam login → rate limited
8. **All tests pass:** `pnpm test`
9. **Build succeeds:** `pnpm build`
10. **Docker dev works:** `docker compose up -d && pnpm db:migrate && pnpm dev`
