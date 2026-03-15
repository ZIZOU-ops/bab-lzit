# Babloo v2 — Clean Rebuild Architecture Design

**Date:** 2026-03-08
**Status:** Approved
**Goal:** Full ground-up rebuild of the Babloo home services marketplace with senior-dev architecture. Same features, zero spaghetti.

---

## Priorities (in order)

1. **Debuggability** — correlationIds, structured logging, clear error traces
2. **End-to-end type safety** — tRPC from DB → API → mobile, Zod everywhere
3. **Scalability** — Redis adapter, job queues, stateless API

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| API framework | **Fastify** | 2-3x faster than Express, built-in Pino logging, plugin system |
| API layer | **tRPC v11** (Fastify adapter) | End-to-end type safety, zero code generation |
| Database | **PostgreSQL + Prisma 6** | Proven, typed ORM, migration system |
| Real-time | **Socket.IO + Redis adapter** | Room-based messaging, scalable across instances |
| Validation | **Zod** | Shared schemas, powers tRPC input + socket payload validation |
| Mobile | **Expo (managed) + Expo Router** | File-based routing, OTA updates, push notifications |
| Mobile data | **tRPC React Query hooks** | Type-safe API calls, caching, optimistic updates |
| Job queue | **BullMQ** (Redis) | Push notifications, cleanup jobs, matching |
| Logging | **Pino** | Structured JSON logs, redaction, correlationId |
| Error tracking | **Sentry** | Unhandled exceptions, performance monitoring |
| Monorepo | **Turborepo + pnpm workspaces** | Build caching, task orchestration |
| Local dev | **Docker Compose** | PostgreSQL + Redis, no local installs |

---

## Monorepo Structure

```
babloo-v2/
├── apps/
│   ├── api/                   # Fastify + tRPC server
│   └── mobile/                # Expo Router app
├── packages/
│   ├── shared/                # Zod schemas, types, pricing, FSM, error codes
│   └── config/                # Shared tsconfig, eslint configs
├── turbo.json
├── pnpm-workspace.yaml
├── docker-compose.yml         # PostgreSQL + Redis for local dev
└── .env.example
```

---

## API Architecture

```
apps/api/
├── src/
│   ├── server.ts                  # Fastify app + tRPC plugin + Socket.IO attach
│   ├── config/
│   │   └── env.ts                 # Zod-validated env vars (crash on boot if invalid)
│   ├── trpc/
│   │   ├── index.ts               # initTRPC with context
│   │   ├── context.ts             # { db, user, logger, requestId }
│   │   ├── router.ts              # Merges all domain routers
│   │   └── middleware/
│   │       ├── auth.ts            # JWT verification → attaches user to context
│   │       ├── role.ts            # Role guard (client, pro, admin)
│   │       ├── rateLimit.ts       # Redis-backed per-procedure limiting
│   │       └── logger.ts          # Request/response logging with correlationId
│   ├── routers/                   # Thin: validate input → call service → return
│   │   ├── auth.router.ts
│   │   ├── user.router.ts
│   │   ├── order.router.ts
│   │   ├── negotiation.router.ts
│   │   ├── pro.router.ts
│   │   ├── pricing.router.ts
│   │   └── admin.router.ts
│   ├── services/                  # ALL business logic lives here
│   │   ├── auth.service.ts
│   │   ├── order.service.ts
│   │   ├── matching.service.ts
│   │   ├── negotiation.service.ts
│   │   ├── notification.service.ts
│   │   └── pricing.service.ts
│   ├── socket/
│   │   ├── setup.ts               # Socket.IO server + Redis adapter
│   │   ├── auth.ts                # Socket JWT middleware
│   │   ├── types.ts               # Typed events (inferred from shared Zod schemas)
│   │   └── handlers/
│   │       ├── message.handler.ts
│   │       ├── offer.handler.ts
│   │       └── typing.handler.ts
│   ├── jobs/                      # BullMQ processors
│   │   ├── queue.ts               # Queue setup (Redis)
│   │   ├── notification.job.ts    # Push notification sending
│   │   └── cleanup.job.ts         # Expired token/OTP cleanup
│   └── lib/
│       ├── prisma.ts              # Singleton with connection pooling
│       ├── redis.ts               # ioredis singleton
│       ├── logger.ts              # Pino with correlationId + redaction
│       └── errors.ts              # AppError → AuthError, NotFoundError, etc.
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── tests/
    ├── setup.ts                   # TestContainers (PostgreSQL + Redis)
    ├── helpers.ts                 # createTestCaller(), mockUser()
    └── routers/                   # One test file per router
```

### API Architecture Rules

1. **Routers are thin.** Parse input (Zod via tRPC), check auth (middleware), call service. No business logic.
2. **Services own all logic.** Matching, pricing, FSM transitions, notification triggers. Services receive `db` and `logger` via tRPC context.
3. **Every request gets a correlationId.** Flows: Fastify → tRPC context → service → Pino → BullMQ jobs → Socket events → Sentry tags.
4. **Env validation crashes on boot.** Missing `JWT_SECRET` in prod = crash with clear error. No silent fallbacks.
5. **Socket events are Zod-validated at runtime.** Every incoming payload goes through `safeParse` before processing.
6. **Background jobs via BullMQ.** Push notifications and cleanup run async in Redis-backed queues. No inline blocking.

---

## Mobile App Architecture

```
apps/mobile/
├── app/                              # Expo Router (file-based routing)
│   ├── _layout.tsx                   # Root: AuthGate → providers (blocks until hydrated)
│   ├── index.tsx                     # Redirect based on auth + role
│   │
│   ├── (auth)/                       # Public — no auth required
│   │   ├── _layout.tsx
│   │   ├── index.tsx                 # Entry (choose sign-in/sign-up)
│   │   ├── sign-up-email.tsx
│   │   ├── sign-up-phone.tsx
│   │   ├── sign-in-email.tsx
│   │   ├── sign-in-phone.tsx
│   │   ├── otp.tsx
│   │   └── forgot-password.tsx
│   │
│   ├── (client)/                     # Protected — client role
│   │   ├── _layout.tsx               # Auth guard + tabs
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx           # Bottom tab bar
│   │   │   ├── index.tsx             # Home
│   │   │   ├── orders.tsx            # Orders list
│   │   │   └── profile.tsx           # Profile/settings
│   │   ├── booking/
│   │   │   ├── service.tsx           # Pick service type
│   │   │   ├── details.tsx           # Configure (surface, guests, etc.)
│   │   │   ├── search.tsx            # Searching for pros
│   │   │   ├── confirm.tsx           # Review & confirm
│   │   │   └── confirmed.tsx         # Success screen
│   │   └── order/
│   │       ├── [id].tsx              # Order detail
│   │       ├── chat.tsx              # Negotiation chat
│   │       ├── tracking.tsx          # Live status tracking
│   │       └── rating.tsx            # Rate & review
│   │
│   └── (pro)/                        # Protected — pro role
│       ├── _layout.tsx               # Auth + role guard
│       ├── (tabs)/
│       │   ├── _layout.tsx
│       │   ├── index.tsx             # Pro dashboard
│       │   ├── orders.tsx            # Assigned orders
│       │   └── profile.tsx           # Pro profile/availability
│       └── order/
│           ├── [id].tsx              # Pro order detail
│           ├── chat.tsx              # Chat with client
│           └── offers.tsx            # Manage offers
│
├── src/
│   ├── providers/
│   │   ├── AuthProvider.tsx          # State machine: loading → authenticated | unauthenticated
│   │   ├── TRPCProvider.tsx          # tRPC + React Query client
│   │   ├── SocketProvider.tsx        # Connect/disconnect/reconnect lifecycle
│   │   └── I18nProvider.tsx
│   │
│   ├── hooks/
│   │   ├── auth/
│   │   │   ├── useAuthState.ts       # Read auth state (no mutations)
│   │   │   └── useAuthActions.ts     # Login, signup, logout, refresh
│   │   ├── orders/
│   │   │   ├── useOrderQueries.ts    # Fetch (owns query keys, stale time)
│   │   │   ├── useOrderMutations.ts  # Create, cancel, rate (owns optimistic updates)
│   │   │   └── useOrderSocket.ts     # Subscribe to order status events
│   │   ├── negotiation/
│   │   │   ├── useMessages.ts        # Fetch + send messages
│   │   │   ├── useOffers.ts          # Fetch + create/accept offers
│   │   │   └── useChatSocket.ts      # Message/typing/offer socket events
│   │   ├── pro/
│   │   │   ├── useProQueries.ts
│   │   │   ├── useProMutations.ts
│   │   │   └── useProSocket.ts
│   │   └── usePushNotifications.ts
│   │
│   ├── components/
│   │   ├── ui/                       # Design system: Button, Input, Card, Badge, etc.
│   │   ├── forms/                    # Reusable form inputs (no logic)
│   │   ├── order/                    # OrderCard, StatusBadge, PriceDisplay
│   │   └── chat/                     # MessageBubble, NegotiationBar, TypingIndicator
│   │
│   ├── lib/
│   │   ├── trpc.ts                   # createTRPCReact<AppRouter>
│   │   ├── socket.ts                 # Socket.IO client with typed events
│   │   ├── storage.ts               # SecureStore wrapper (atomic read/write)
│   │   └── i18n.ts                   # i18next init + translation loader
│   │
│   └── constants/
│       ├── theme.ts                  # Colors, spacing, typography
│       └── config.ts                 # API_URL, timeouts
│
├── assets/
└── app.json
```

### Mobile Architecture Rules

1. **Hook separation by responsibility:**
   - `*Queries.ts` — fetch + cache (owns query keys, stale time, select transforms)
   - `*Mutations.ts` — write + invalidate (owns optimistic updates, error rollback)
   - `*Socket.ts` — subscribe to realtime events, update query cache
   - A hook may compose others but never grows beyond one responsibility.

2. **Auth gate blocks navigation.** `_layout.tsx` renders a splash screen until `AuthProvider` resolves (`loading → authenticated | unauthenticated`). No redirect before hydration.

3. **Screen duplication policy.** Screens are separated by role when workflows or available actions differ materially. Purely visual differences use shared components with role-conditional rendering.

4. **Socket is enhancement, not truth.** Realtime events update React Query cache optimistically. Critical state is always recoverable via tRPC queries on reconnect or app resume.

5. **Token lifecycle.** Refresh is single-flight (deduplicated). HTTP (tRPC link) and Socket.IO share the same token source. Refresh failure → deterministic logout → cache clear → redirect to (auth).

6. **Cache ownership.** Components never touch query keys, `invalidateQueries`, or `setQueryData`. Hooks own all cache mechanics. Components consume `{ data, isLoading, error, mutate }`.

7. **Feature modules (escape hatch).** When a domain (booking, negotiation) grows complex, extract to `src/features/<domain>/`. Not required at launch.

---

## Shared Package

```
packages/shared/
├── src/
│   ├── schemas/
│   │   ├── input/                    # What goes INTO the API
│   │   │   ├── auth.input.ts
│   │   │   ├── order.input.ts
│   │   │   ├── user.input.ts
│   │   │   ├── negotiation.input.ts
│   │   │   ├── pro.input.ts
│   │   │   └── admin.input.ts
│   │   ├── output/                   # What comes OUT of the API
│   │   │   ├── order.output.ts
│   │   │   ├── user.output.ts
│   │   │   ├── negotiation.output.ts
│   │   │   └── pro.output.ts
│   │   └── socket/                   # Runtime Zod for socket payloads
│   │       ├── client-events.ts
│   │       └── server-events.ts
│   │
│   ├── types/
│   │   ├── enums.ts                  # Role, ServiceType, OrderStatus, OfferStatus, etc.
│   │   ├── socket-events.ts          # z.infer<> from socket Zod schemas
│   │   └── index.ts
│   │
│   ├── pricing/
│   │   ├── constants.ts              # MENAGE_BASE_RATE=50, CUISINE_PER_GUEST=80, etc.
│   │   ├── calculator.ts             # Pure: calculatePrice(serviceType, details) → number
│   │   └── negotiation.ts            # CEILING_MULTIPLIER=1.3, INCREMENT=5, bounds logic
│   │
│   ├── fsm/
│   │   └── order-status.ts           # transitions map, canTransition(), getNextStates()
│   │
│   └── errors/
│       └── codes.ts                  # AUTH_001-099, ORDER_100-199, NEG_200-299, etc.
│
├── package.json                      # "exports" field — no deep imports
└── tsconfig.json
```

### Shared Package Rules

1. **Explicit package exports.** `"exports"` field whitelists entry points. No deep imports.
2. **Input vs output schemas.** Separated because they diverge as the contract grows.
3. **Socket payloads are Zod-validated at runtime.** Types are `z.infer<>`, not hand-written interfaces.
4. **API is authoritative for FSM and permissions.** Mobile uses `canTransition()` for UI guidance only.
5. **Error code taxonomy is stable.** `DOMAIN_NNN` format. Codes never removed or reassigned.
6. **Pure and framework-agnostic.** No React, Express, or Node.js APIs. Must run in Node, RN, and tests.

---

## Database Schema

### Tables (13 total, same as v1)

1. **users** — Core user data (email, phone, password hash, role, locale, push tokens)
2. **professionals** — Pro profile (skills, rating, reliability, zones, availability, team lead flag)
3. **orders** — Order header (client, service type, price, status, schedule)
4. **order_details** — Service-specific details (surface, guests, children, etc.)
5. **order_assignments** — Pro assignments (lead/member, status, confirmation)
6. **status_events** — Audit trail of status transitions
7. **messages** — Negotiation chat (seq-ordered, deduplicated)
8. **negotiation_offers** — Price offers (seq-ordered)
9. **otp_challenges** — OTP temp storage (phone, code hash, attempts, expiry)
10. **refresh_tokens** — Token rotation (family, hash, revocation, expiry)
11. **ratings** — Client reviews (stars, comment)
12. **audit_logs** — Admin actions
13. **idempotency_keys** — Request deduplication

### Schema Rules

1. **`seq` is server-assigned.** Monotonic per order, assigned via `MAX(seq) + 1` in a transaction. Canonical ordering field.
2. **Compound cursor pagination.** Cursors use `(createdAt, id)` for deterministic ordering.
3. **Tokens and OTPs stored hashed.** Algorithm is implementation detail, not schema concern.
4. **Deduplication at DB level.** `@@unique([orderId, clientMessageId])` for messages, `IdempotencyKey` table for mutations.
5. **DB-level enforcement.** Unique constraints on seq, enum types for status, explicit `onDelete` behavior on all FKs.
6. **Proper indexes for every query pattern.** No full table scans.

---

## Security

### Env Validation

Zod schema validates all env vars at boot. Missing critical vars in production → crash with clear error.

### Rate Limit Policy Matrix

| Endpoint/Event | Window | Max | Scope |
|---------------|--------|-----|-------|
| `auth.login` | 15 min | 10 | Per IP |
| `auth.otpRequest` | 15 min | 3 | Per phone |
| `auth.signup` | 1 hour | 5 | Per IP |
| `order.create` | 1 min | 5 | Per user |
| `negotiation.sendMessage` | 1 min | 30 | Per user |
| `negotiation.createOffer` | 1 min | 5 | Per user |
| Socket `message` | 1 min | 30 | Per user |
| Socket `typing` | 5 sec | 3 | Per user |
| All other procedures | 1 min | 60 | Per user |

### Error Handling

- `AppError` hierarchy: `AuthError`, `NotFoundError`, `ValidationError`, `ForbiddenError`, `ConflictError`
- Each has an error code (`AUTH_001`) and HTTP status
- `toJSON()` strips internals (stack traces, query details, file paths)
- tRPC error formatter maps `AppError` → tRPC error codes

### Socket Re-Auth & Reconnect

1. Token refresh → `AuthProvider` updates stored token
2. `SocketProvider` emits `auth:renew` with new token
3. Server verifies → updates socket auth context
4. On disconnect → reconnect with current token
5. On reconnect → re-join rooms + fetch missed data via tRPC (not socket replay)
6. 3 failed reconnects → "connection lost" banner, fall back to tRPC polling

---

## Observability

### Health Checks

- `GET /healthz` — **Liveness.** Process alive? 200. No dependency checks.
- `GET /readyz` — **Readiness.** DB + Redis reachable? 200. Used by load balancer.

### Structured Logging (Pino)

- JSON in production, pretty-print in dev
- Every log line includes `correlationId`
- Redaction paths: passwords, tokens, OTP codes, authorization headers
- Request/response bodies at `debug` level only

### CorrelationId Flow

```
HTTP request → Fastify requestId
  → tRPC context.requestId
    → service: logger.child({ requestId })
      → BullMQ: job.data.correlationId
        → Socket: payload.correlationId
          → Sentry: scope.setTag('correlationId')
```

### Idempotency

- Push notification jobs: `orderId + eventType + timestamp` as BullMQ `jobId`
- Socket mutations: `clientMessageId` / `IdempotencyKey` table
- All retry-prone flows have dedup keys

---

## Feature Inventory (1:1 with v1)

### Authentication
- Email + password signup/login
- Phone + OTP signup/login/password reset
- Refresh token rotation with family tracking
- Logout (single + all sessions)
- JWT access tokens (15m) + refresh tokens (30d)
- Email normalization to lowercase
- Role-based access (client, pro, admin)

### User Management
- Profile retrieval & updates
- Push token registration/unregistration

### Orders (Client)
- Create (draft → submit), list (cursor pagination), detail, cancel
- Rating/review (1-5 stars + comment)
- Service types: ménage (surface, clean type, team), cuisine (guests, dishes), childcare (children, hours)

### Order Lifecycle FSM
- draft → submitted → searching → negotiating → accepted → en_route → in_progress → completed | cancelled
- Validated transitions with guards and side effects

### Professional Features
- Profile management, availability toggle
- Skill and zone management
- View assigned orders, open team slots
- Join requests, lead approves/rejects members
- Assignment confirm/decline

### Negotiation & Messaging
- Real-time chat (Socket.IO rooms)
- Seq-based pagination, message deduplication
- Typing indicators
- Price offers/counter-offers with bounds (floor + 30% ceiling, 5 MAD increments)
- Offer acceptance locks final price

### Pricing
- Ménage: 50 MAD/h base + surface/team adjustments
- Cuisine: 80 MAD/person
- Childcare: 30 MAD/h
- Public estimate endpoint
- Admin price override

### Matching
- Zone-based, skill-matched, availability-checked
- Rating/reliability sorting
- Team lead requirement enforcement

### Admin
- Status override (bypass FSM)
- Price override
- User suspension/reactivation
- Audit log viewing (paginated)

### Notifications
- Push (Expo) for: status changes, new messages, offers, assignments
- Invalid token cleanup

### i18n
- French, Arabic, English
- Locale detection, user preference storage

---

## API Routes (same endpoints, tRPC procedures)

### auth.*
- `signup` — Email/phone signup
- `login` — Email+password login
- `otpRequest` — Request OTP
- `otpVerify` — Verify OTP & issue tokens
- `refresh` — Refresh access token
- `logout` — Single session logout
- `logoutAll` — All sessions logout

### user.*
- `me` — Current user profile
- `updateProfile` — Update profile
- `registerPushToken` — Register push token
- `unregisterPushToken` — Unregister push token

### order.*
- `create` — Create order
- `list` — List orders (cursor-paginated)
- `byId` — Get order details
- `cancel` — Cancel order
- `updateStatus` — Pro updates status
- `rate` — Rate completed order

### negotiation.*
- `messages` — List messages (seq-paginated)
- `sendMessage` — Send message
- `offers` — List offers
- `createOffer` — Create offer
- `acceptOffer` — Accept offer
- `poll` — Polling fallback

### pro.*
- `profile` — Professional profile
- `toggleAvailability` — Toggle availability
- `orders` — Pro's assigned orders
- `openSlots` — Team orders with open slots
- `joinRequest` — Request team slot
- `joinRequests` — View join requests (lead)
- `approveAssignment` — Lead approves
- `rejectAssignment` — Lead rejects
- `declineAssignment` — Pro declines

### pricing.*
- `estimate` — Public pricing estimate

### admin.*
- `overrideStatus` — Override order status
- `overridePrice` — Override order price
- `toggleUser` — Activate/deactivate user
- `auditLog` — View audit trail

---

## Testing Strategy

- **Unit tests:** Services (pure business logic) with mocked Prisma
- **Integration tests:** tRPC routers via `createCaller()` with TestContainers (real PostgreSQL + Redis)
- **Socket tests:** Socket.IO client against test server
- **Framework:** Vitest + Supertest + TestContainers
- **Coverage target:** All happy paths + error paths for auth, orders, negotiation

---

## Dependencies (curated, no deprecated packages)

### API
```
fastify, @fastify/cors, @fastify/helmet, @fastify/rate-limit
@trpc/server
@prisma/client, prisma
socket.io, @socket.io/redis-adapter
bullmq, ioredis
pino, pino-pretty
@sentry/node
bcryptjs, jsonwebtoken
zod
```

### Mobile
```
expo, expo-router, expo-secure-store, expo-notifications
react, react-native
@trpc/client, @trpc/react-query, @tanstack/react-query
socket.io-client
i18next, react-i18next, expo-localization
zod
```

### Shared
```
zod (peer dependency — no framework deps)
```

### Dev
```
typescript, vitest, supertest, testcontainers
turborepo, pnpm
eslint, prettier
```
