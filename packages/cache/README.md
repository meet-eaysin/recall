# `@repo/cache`

Shared cache abstraction for Recall Beta.

## Architecture Role

This package provides the pluggable cache module used by both the API and the worker.

See the root architecture document for repository context:

- [`../../architecture.md`](../../architecture.md)

## Provides

- Nest global cache module
- Redis provider
- Upstash Redis provider
- Common cache provider interface

## Used By

- `apps/api`
- `apps/worker`

## Provider Model

`CacheModule.forRoot()` selects a concrete cache provider based on configuration and binds it to the shared `ICacheProvider` contract.
