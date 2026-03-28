# Recall Beta Web

`apps/web` is the Next.js 16 frontend for Recall Beta.

## Scope

- Marketing pages
- Auth entrypoint
- Workspace chat flows
- Library and document detail views
- Graph explorer
- Analytics and settings
- Legal consent UI

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- TanStack Query
- Zod for env parsing

## Development

From the repo root:

```bash
yarn turbo run dev --filter web
```

From this workspace:

```bash
yarn dev
```

Default local port: `5273`

## Environment

Primary variables:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_ENABLE_DEV_AUTH`
- `NEXT_PUBLIC_DEV_USER_ID`

Validated in [lib/env.ts](./lib/env.ts).

## Notes

- API requests are routed through the shared client helpers in `lib/api.ts`.
- Authenticated document creation uses `POST /api/v1/documents`.
- The root layout currently uses Google font loading for `Geist` and `Sora`; offline builds require local font replacement.
