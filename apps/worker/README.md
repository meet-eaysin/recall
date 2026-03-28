# Recall Beta Worker

`apps/worker` is the asynchronous processing service for Recall Beta.

## Responsibilities

- Ingestion webhooks
- Transcript generation
- Summary generation
- Graph rebuild jobs
- Notion sync jobs
- Email dispatch jobs

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
