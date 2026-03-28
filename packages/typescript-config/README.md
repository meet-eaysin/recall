# `@repo/typescript-config`

Shared TypeScript configuration package for Recall Beta.

## Presets

- `base.json`
- `nextjs.json`
- `nestjs.json`
- `react-library.json`

## Notes

- The Nest preset is now strict on implicit `any` and nullability
- Workspace tsconfig files should extend these presets instead of redefining policy
