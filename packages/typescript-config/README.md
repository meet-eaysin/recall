# `@repo/typescript-config`

Shared TypeScript configuration package for Recall Beta.

## Architecture Role

This package belongs to the repository tooling layer and standardizes TypeScript compiler settings across applications and packages.

See the root architecture document for runtime-oriented architecture details:

- [`../../architecture.md`](../../architecture.md)

## Presets

- `base.json`
- `nextjs.json`
- `nestjs.json`
- `react-library.json`

## Notes

- The Nest preset is now strict on implicit `any` and nullability
- Workspace tsconfig files should extend these presets instead of redefining policy
