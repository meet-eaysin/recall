# `@repo/ai`

Shared AI runtime for Recall Beta.

## Architecture Role

This package is the shared AI integration layer used by runtime applications, primarily `apps/api` and `apps/worker`.

It centralizes:

- provider registry
- LLM client resolution
- embedding resolution
- Qdrant vector operations
- extraction, chunking, and summarization pipelines

See the root architecture document for repository context:

- [`../../architecture.md`](../../architecture.md)

## Provides

- LLM client factory and provider adapters
- Embedding adapters
- Qdrant client wrapper
- Extraction pipelines for URL, PDF, image, and YouTube sources
- Summarization and chunking pipelines

## Used By

- `apps/api`
- `apps/worker`

## Notes

- Provider selection is environment-driven.
- This package is runtime code, not just type definitions.
- `LLMClientFactory` can resolve system-default and user-specific LLM configuration.
