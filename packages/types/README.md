# `@repo/types`

Shared cross-application types for Recall Beta.

## Architecture Role

This package is the shared contract boundary between applications and packages.

See the root architecture document for repository context:

- [`../../architecture.md`](../../architecture.md)

## Includes

- auth types
- API envelope types
- document, ingestion, graph, review, analytics, legal, notion, queue, and search types

## Notes

- This package is the public type contract between frontend and backend code
- It also supports shared contracts for graph, ingestion, legal, Notion, queue, review, analytics, and search features.
