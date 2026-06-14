# Peppermint

## Workspace

- Monorepo uses Yarn 4 workspaces with Turbo. Use `yarn`, not `npm`/`pnpm`/`bun`.
- Yarn is configured with `nodeLinker: node-modules` in `.yarnrc.yml`; expect real `node_modules`, not Plug'n'Play.
- Root scripts are minimal: `yarn dev`, `yarn build`, `yarn lint`, `yarn format`.
- `turbo run lint` only does real work for packages that define a `lint` script. Currently that is `apps/landing`; do not assume repo-wide lint/typecheck/test coverage exists.

## App Boundaries

- `apps/client` is the main product UI. It is a Next.js pages-router app (`pages/_app.tsx`), not the app router.
- `apps/client` rewrites `/api/v1/:path*` to `http://localhost:5003/api/v1/:path*` in `apps/client/next.config.js`; frontend work that touches data flow usually needs the API running too.
- `apps/api` is the Fastify backend entrypoint at `apps/api/src/main.ts`.
- `apps/docs` is a separate Nextra docs site.
- `apps/landing` is a separate marketing site on Next 15/React 19 RC. Keep it isolated from the older client app stack.

## Dev Commands

- Run the whole workspace in dev with `yarn dev`.
- Run a single app with workspace scope when you only need one surface: `yarn workspace client dev`, `yarn workspace api dev`, `yarn workspace docs dev`, `yarn workspace landing dev`.
- Build a single app with `yarn workspace <name> build`.
- Only `apps/landing` has a local lint command: `yarn workspace landing lint`.
- Root formatting only targets `*.ts`, `*.tsx`, and `*.md`: `yarn format`.

## Database And Env

- API Prisma schema is `apps/api/src/prisma/schema.prisma` and uses PostgreSQL via `DATABASE_URL`.
- API env template is `apps/api/.env.example`; client env template is `apps/client/.env.example`.
- `apps/api` has both `db:migrate` and `db:push`, but `db:push` is `prisma db push --accept-data-loss`. Treat it as destructive.
- API startup already runs `prisma migrate deploy`, `prisma generate`, and `prisma db seed` from `src/main.ts` before listening on port `5003`. Avoid re-adding duplicate startup steps unless you intend to change boot behavior.

## Verification

- There is no verified repo-wide test script.
- For backend-only changes, the most accurate lightweight check is `yarn workspace api build`.
- For client/docs/landing changes, use the package-local build command because there is no shared typecheck script.
- If you use `yarn lint` at repo root, expect it to miss most packages because they do not define `lint`.

## Docker / CI

- CI workflows in `.github/workflows/` only build and publish Docker images; they do not run tests or lint.
- Main compose files are at repo root. `docker-compose.local.yml` builds from the local repo, maps app UI to `3000`, and maps API `5003` to host `5001`.
- Default containerized/local DB credentials are committed in the compose files and `apps/api/.env.example`; reuse those values when you need a quick local Postgres.

## Codebase Quirks

- `apps/client` mixes older conventions: pages router, `react-query` v3, `next-translate`, JS and TS files, and `//@ts-nocheck` in `pages/_app.tsx`. Match local patterns instead of modernizing incidentally.
- `apps/client` has no `src/` app structure; most work happens directly under `pages/`, `layouts/`, `components/`, and `store/`.
