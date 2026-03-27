# `@repo/ai`

Shared AI runtime for Recall Beta.

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
