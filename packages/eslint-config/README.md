# `@repo/eslint-config`

Shared ESLint presets for Recall Beta.

## Architecture Role

This package is part of the repository tooling layer rather than the runtime architecture. It keeps linting policy consistent across apps and packages.

See the root architecture document for runtime-oriented architecture details:

- [`../../architecture.md`](../../architecture.md)

## Includes

- base config
- Next.js config
- NestJS config
- library config
- React internal config

## Notes

- The Nest preset enforces no explicit `any`
- Apps extend these presets rather than defining policy independently
