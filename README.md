# Recall Beta

Recall is a monorepo for a document-first knowledge workspace. It includes a Next.js web app, a NestJS API, a NestJS worker, and shared packages for AI, data access, queueing, caching, and shared types.

## Workspace Layout

- `apps/web`: Next.js 16 App Router frontend for marketing pages, authenticated workspace flows, search, graph, library, analytics, and settings.
- `apps/api`: NestJS 11 HTTP API for auth, documents, search, graph, knowledge, legal, analytics, and user settings.
- `apps/worker`: NestJS 11 worker/webhook service for ingestion, graph building, Notion jobs, transcripts, summaries, and email jobs.
- `packages/*`: shared runtime and tooling packages.

## Runtime Architecture

```text
web -> api -> mongo
          -> cache
          -> queue -> worker
worker -> qdrant
worker -> llm / embedding providers
```

Current document creation is handled through `POST /api/v1/documents`. There is no separate `/documents/upload` route.

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS v4, TanStack Query, Radix/Base UI, Framer Motion
- Backend: NestJS 11, Express, Swagger, class-validator
- Data: MongoDB via Mongoose, Qdrant for vector search
- Async: pluggable queue providers, worker-side webhook processors
- Tooling: Turborepo, Yarn 4, TypeScript, ESLint, Jest

## Prerequisites

- Node.js `24.x`
- Corepack with Yarn `4.5.1`
- Docker and Docker Compose for local infra

## Setup

1. Install dependencies.

```bash
yarn install
```

2. Start local infrastructure.

```bash
docker compose up -d
```

3. Copy environment files as needed.

- `apps/web/.env.example -> apps/web/.env.local`
- `apps/api/.env.example -> apps/api/.env.local`
- `apps/worker/.env.example -> apps/worker/.env.local`

4. Start the full workspace.

```bash
yarn dev
```

## Common Commands

```bash
yarn dev
yarn build
yarn lint
yarn lint:fix
yarn typecheck
yarn test
yarn test:e2e
yarn format
```

## Notes

- The web app currently imports Google fonts at build time. In restricted-network environments, `yarn build` for `apps/web` will fail unless those fonts are made local.
- The API and worker both rely on environment-driven provider configuration. Review `turbo.json` and each app's `.env.example` before deployment.

## Documentation

- Root contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Web app: [apps/web/README.md](./apps/web/README.md)
- API: [apps/api/README.md](./apps/api/README.md)
- Worker: [apps/worker/README.md](./apps/worker/README.md)

## License

UNLICENSED
