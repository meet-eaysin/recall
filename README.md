# Recall Beta

Recall is a monorepo for a document-first knowledge workspace. It contains a Next.js frontend, a NestJS API, a NestJS worker, and shared packages for AI, database access, queueing, storage, caching, and shared contracts.

## Workspace Layout

- `apps/web`: Next.js 16 App Router frontend for marketing, authentication, workspace, graph, library, analytics, search, settings, and legal flows
- `apps/api`: NestJS 11 HTTP API for auth, users, documents, search, graph, knowledge, analytics, review, legal, Notion, and provider-backed infrastructure
- `apps/worker`: NestJS 11 async worker and webhook processor for ingestion, summaries, transcripts, graph jobs, Notion jobs, and email dispatch
- `packages/*`: shared runtime and tooling packages used by the apps

## Runtime Architecture

```text
web -> api -> mongo
          -> cache
          -> queue -> worker
worker -> qdrant
worker -> llm / embedding providers
worker -> storage / email / internal api callbacks
```

## Full Architecture Documentation

Detailed architecture documentation is available in:

- [architecture.md](./architecture.md)

That document covers:

- module and folder structure
- providers and services
- feature configuration
- data flow
- frontend/backend/database/external service connections
- design decisions visible in code
- extensibility guidance

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS v4, TanStack Query
- Backend: NestJS 11, Express, Swagger, class-validator
- Data: MongoDB via Mongoose, Qdrant
- Async: pluggable queue providers with worker-side processors
- Tooling: Turborepo, Yarn 4, TypeScript, ESLint, Jest

## Prerequisites

- Node.js `24.x`
- Corepack with Yarn `4.5.1`
- Docker and Docker Compose

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

4. Start the workspace.

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

## Additional Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [apps/web/README.md](./apps/web/README.md)
- [apps/api/README.md](./apps/api/README.md)
- [apps/worker/README.md](./apps/worker/README.md)
- [packages/ai/README.md](./packages/ai/README.md)
- [packages/cache/README.md](./packages/cache/README.md)
- [packages/db/README.md](./packages/db/README.md)
- [packages/queue/README.md](./packages/queue/README.md)
- [packages/storage](./packages/storage)
- [packages/types/README.md](./packages/types/README.md)

## Notes

- The web app currently imports Google fonts at build time. Offline or restricted-network builds require local font replacement.
- The API and worker rely on environment-driven provider configuration. Review `turbo.json` and per-app env files before deployment.

## License

UNLICENSED
