# `@repo/crypto`

Shared crypto helpers for Recall Beta.

## Architecture Role

This package contains encryption and decryption helpers used by runtime packages. A confirmed usage in the repository is AI config handling, where encrypted user API keys are decrypted before provider clients are created.

See the root architecture document for repository context:

- [`../../architecture.md`](../../architecture.md)

## Purpose

- Encryption helpers
- token and secret handling support
- shared cryptographic utilities consumed by other runtime packages

## Used By

- `@repo/ai`
- `apps/api`
