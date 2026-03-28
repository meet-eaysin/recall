# `@repo/queue`

Shared queue abstraction for Recall Beta.

## Provides

- Nest global queue module
- queue service
- HTTP queue provider
- QStash queue provider
- shared queue provider interface

## Used By

- `apps/api` for dispatch
- `apps/worker` for webhook-oriented processing flows
