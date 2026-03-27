# Contributing

## Baseline

- Use Node `24.x` and Yarn `4.5.1`
- Install from the repo root with `yarn install`
- Run services through the monorepo unless you are intentionally isolating an app

## Standards

- Keep changes explicit and local. Do not add generic abstractions without a concrete need.
- Preserve strict typing. Avoid `any`, unsafe casts, and non-null assertions unless there is no better option.
- Match the existing architectural split:
  - `apps/web` for UI and frontend integration
  - `apps/api` for HTTP boundary and synchronous business flows
  - `apps/worker` for async/background processing
  - `packages/*` for shared runtime concerns
- Prefer fixing the contract or architecture rather than adapting tests/docs around stale behavior.

## Validation Before Merge

Run the relevant checks from the repo root:

```bash
yarn lint
yarn typecheck
yarn test
yarn test:e2e
```

If you change shared config, queues, environment loading, or API contracts, also run:

```bash
yarn build
```

## Documentation Expectations

- Update README files when routes, scripts, runtime requirements, or package responsibilities change.
- Keep docs aligned with the current API surface. Example: document creation is `POST /api/v1/documents`, not `/documents/upload`.

## Pull Requests

- Use a clear title and summary
- Explain behavior changes and verification steps
- Call out intentional breaking changes
- Do not leave stale docs or stale tests behind
