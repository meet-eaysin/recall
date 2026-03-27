# `@repo/db`

Shared MongoDB and Mongoose layer for Recall Beta.

## Provides

- Database connection helpers
- Mongoose models
- persistence repositories
- storage helpers
- module exports for document, graph, user, notion, ingestion, activity, and related domains

## Notes

- Used by both API and worker
- Connection lifecycle is managed at the app layer
