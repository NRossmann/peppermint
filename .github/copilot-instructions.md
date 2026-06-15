# Peppermint Copilot Instructions

## Build, lint, and test commands

- Package manager: use `yarn` with Yarn 4 workspaces. Do not switch to npm/pnpm/bun.
- Whole workspace:
  - `yarn dev` runs all workspace dev processes through Turbo.
  - `yarn build` runs each package `build` script through Turbo.
  - `yarn lint` only does meaningful work for packages that define `lint`; today that is effectively `apps/landing`.
  - `yarn format` runs Prettier on `**/*.{ts,tsx,md}` only.
- Single app:
  - `yarn workspace client dev|build`
  - `yarn workspace api dev|build`
  - `yarn workspace docs dev|build`
  - `yarn workspace landing dev|build|lint`
- Backend database commands live in `apps/api`:
  - `yarn workspace api db:migrate`
  - `yarn workspace api db:push` (`prisma db push --accept-data-loss`, so treat it as destructive)
  - `yarn workspace api generate`
- Testing:
  - There is no verified repo-wide `test` script.
  - No dedicated single-test command is wired up today; do not assume `yarn test` exists.
  - For backend-only changes, the most reliable lightweight check is `yarn workspace api build`.
  - For UI changes, use the package-local build for the app you touched.

## High-level architecture

- This is a Yarn workspace monorepo with four apps:
  - `apps/client`: the main product UI. It uses the Next.js **pages router**, not the app router.
  - `apps/api`: the Fastify backend, started from `apps/api/src/main.ts`.
  - `apps/docs`: a separate Nextra docs site.
  - `apps/landing`: a separate marketing site on a newer Next 15 / React 19 RC stack.
- The main user-facing application is split between `apps/client` and `apps/api`. In local development, the client rewrites `/api/v1/:path*` to `http://localhost:5003/api/v1/:path*`, so frontend work that touches data usually needs the API running too.
- `apps/api/src/routes.ts` is the backend route composition point. It wires controller modules like `auth`, `ticket`, `ticketStates`, `users`, `roles`, `config`, and others into one Fastify server.
- Backend persistence is Prisma against PostgreSQL. The schema is `apps/api/src/prisma/schema.prisma`, and it models the product domain directly: users, sessions, roles, ticket states, tickets, comments, clients, notes, files, notifications, and related auth/provider config.
- API startup has side effects: `apps/api/src/main.ts` runs `prisma migrate deploy`, `prisma generate`, and `prisma db seed` before listening on port `5003`. Do not add duplicate startup migration/seed steps unless you are intentionally changing boot behavior.
- Client app composition is route-driven in `apps/client/pages/_app.tsx`. Layout/provider selection happens by pathname (`/admin`, `/settings`, `/portal`, `/auth`, etc.) rather than a central app router layout tree.
- Shared workspace packages are mostly configuration-only (`packages/config`, `packages/tsconfig`), not shared runtime business logic.

## Key conventions

- In `apps/client`, prefer the existing structure under `pages/`, `layouts/`, `components/`, `store/`, and `@/shadcn`. Do not introduce an `app/` router or a new `src/` layout for incidental changes.
- The client is a mixed-codebase surface: JS and TS coexist, `pages/_app.tsx` is `//@ts-nocheck`, and both older UI code and newer shadcn-style components are present. Match the nearby style instead of trying to modernize unrelated code.
- The `@/*` alias in `apps/client` points to the literal `apps/client/@/*` directory. Imports like `@/shadcn/...` are expected and should not be “corrected” to a `src` alias.
- Client auth/session flow is cookie-to-header based:
  - login stores the JWT/session token in the `session` cookie
  - client pages commonly read that cookie with `cookies-next`
  - authenticated requests send `Authorization: Bearer <token>` to `/api/v1/...`
- Backend auth is centralized in `apps/api/src/main.ts` and `apps/api/src/lib/session.ts`. Most routes are protected by default; only a small allowlist of auth/public endpoints bypasses the JWT pre-handler.
- RBAC is layered on top of session auth with `requirePermission(...)` from `apps/api/src/lib/roles.ts`. When a route already uses that middleware, extend the existing permission model instead of inventing a parallel check.
- Internationalization in `apps/client` uses `next-translate` with the `peppermint` namespace configured in `apps/client/i18n.js`. Existing pages commonly call `useTranslation("peppermint")`; reuse that pattern for user-facing copy.
- `apps/landing` is intentionally isolated from the main product stack. Keep changes there self-contained instead of sharing assumptions with `apps/client`, which runs different Next/React versions and different conventions.
- CI in `.github/workflows/` builds and publishes Docker images; it is not the source of truth for repo-wide test or lint coverage.
