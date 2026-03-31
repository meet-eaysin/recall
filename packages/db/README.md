# `@repo/db`

Shared MongoDB and Mongoose layer for Recall Beta.

## Architecture Role

This package is the shared persistence-model layer for the monorepo.

It provides:

- MongoDB connection lifecycle helpers
- exported Mongoose models and types by domain
- a common persistence surface used by app-level repositories

See the root architecture document for repository context:

- [`../../architecture.md`](../../architecture.md)

## Provides

- Database connection helpers
- Mongoose models
- persistence repositories
- storage helpers
- module exports for document, graph, user, notion, ingestion, activity, and related domains

## Notes

- Used by both API and worker
- Connection lifecycle is managed at the app layer
- App-specific repository adapters live in application code, especially under `apps/api/src/modules/*/infrastructure/persistence`.
