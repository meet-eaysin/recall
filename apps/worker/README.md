# Recall Beta Worker

`apps/worker` is the asynchronous processing service for Recall Beta.

## Architecture Role

This app receives async or webhook-driven work and processes operations that should not run inside the synchronous API request path.

See the repository-wide architecture document for the full system view:

- [`../../architecture.md`](../../architecture.md)

## Responsibilities

- Ingestion webhooks
- Transcript generation
- Summary generation
- Graph rebuild jobs
- Notion sync jobs
- Email dispatch jobs

## Internal Structure

The worker root module composes shared infrastructure for:

- cache via `@repo/cache`
- queue via `@repo/queue`
- storage via `@repo/storage`
- AI client factory via the worker LLM module

Worker modules include:

- `documents`
- `email`
- `ingestion`
- `graph`
- `notion`
- `llm`

The worker also provides `InternalApiClientService` for authenticated callbacks to the API using an internal secret.

## Development

From the repo root:

```bash
yarn turbo run dev --filter worker
```

From this workspace:

```bash
yarn dev
```

Default local port: `3002`

## Dependencies

- `@repo/db`
- `@repo/queue`
- `@repo/cache`
- `@repo/ai`

## Environment

Important groups:

- MongoDB: `MONGODB_URI`
- Worker URL and queue webhook settings
- Qdrant and model provider settings
- Upload storage path
- Email provider settings

Resolved in `src/shared/utils/env.ts`.

## Notes

- The worker doubles as a webhook receiver for queue providers.
- Queue provider selection is environment-driven and shared with the API.
- Email provider selection is environment-driven inside the email module.
