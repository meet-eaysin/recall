# `@repo/queue`

Shared queue abstraction for Recall Beta.

## Architecture Role

This package provides the transport abstraction used to dispatch asynchronous work from the API to the worker.

See the root architecture document for repository context:

- [`../../architecture.md`](../../architecture.md)

## Provides

- Nest global queue module
- queue service
- HTTP queue provider
- QStash queue provider
- shared queue provider interface

## Used By

- `apps/api` for dispatch
- `apps/worker` for webhook-oriented processing flows

## Provider Model

`QueueModule.forRoot()` selects either the `qstash` or `http` transport and binds it to the shared queue provider contract.
