# Recall Beta API

`apps/api` is the NestJS 11 HTTP backend for Recall Beta.

## Architecture Role

This app is the synchronous backend boundary for the system. It handles:

- authentication and session flows
- user settings and profile operations
- document creation, retrieval, updates, and ingestion status
- knowledge structures such as folders, tags, and notes
- search, semantic search, and ask-style AI flows
- graph, review, analytics, legal, and Notion configuration APIs

See the repository-wide architecture document for the full system view:

- [`../../architecture.md`](../../architecture.md)

## Modules

- `auth`
- `users`
- `documents`
- `search`
- `graph`
- `knowledge`
- `analytics`
- `review`
- `notion`
- `legal`
- `llm`
- `queue`

## Internal Structure

Most API modules follow a layered structure:

- `application/`: use cases and orchestration services
- `domain/`: entities, repository contracts, domain services
- `infrastructure/`: adapters such as Mongoose persistence, guards, cookies, OAuth integrations
- `interface/`: controllers, DTOs, route-facing schemas

This structure keeps transport and persistence details separate from use-case logic.

## Key Contracts

- Document smart-add: `POST /api/v1/documents`
- Document retrieval: `GET /api/v1/documents/:id`
- Search streaming: `POST /api/v1/search/ask/stream`
- Ingestion retry: `POST /api/v1/documents/:id/retry-ingestion`

## Development

From the repo root:

```bash
yarn turbo run dev --filter api
```

From this workspace:

```bash
yarn dev
```

Default local port: `3001`

## Verification

```bash
yarn typecheck
yarn lint
yarn test
yarn test:e2e
```

## Environment

Important groups:

- MongoDB: `MONGODB_URI`
- Auth/session: `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, OAuth client variables
- Queue/cache: `QUEUE_PROVIDER`, `CACHE_PROVIDER`, Redis/QStash variables
- AI defaults: `DEFAULT_LLM_*`, `DEFAULT_EMBEDDING_*`, provider keys
- Storage: `STORAGE_PROVIDER`, `FILE_UPLOAD_DIR`, `MAX_FILE_SIZE_MB`, Supabase variables

The app loads environment files through `src/shared/utils/env.ts`.

## Infrastructure Composition

At the root module level, the API composes shared packages for:

- cache via `@repo/cache`
- storage via `@repo/storage`
- queue integration via the queue module
- AI client factory via the llm module
- MongoDB connection lifecycle via `@repo/db`

The app also installs global request/response behavior:

- validation pipe
- transform interceptor
- exception filter
- JWT auth guard or dev-user guard depending on environment

## Notes

- Swagger is enabled outside production.
- Global response wrapping, validation, and exception filtering are configured in `src/main.ts`.
- The previous `/documents/upload` route no longer exists; file and URL creation both go through `POST /documents`.
