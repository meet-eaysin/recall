# Recall Beta API

`apps/api` is the NestJS 11 HTTP backend for Recall Beta.

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
- Storage: `FILE_UPLOAD_DIR`, `MAX_FILE_SIZE_MB`

The app loads environment files through `src/shared/utils/env.ts`.

## Notes

- Swagger is enabled outside production.
- Global response wrapping, validation, and exception filtering are configured in `src/main.ts`.
- The previous `/documents/upload` route no longer exists; file and URL creation both go through `POST /documents`.
