# Recall Beta Web

`apps/web` is the Next.js 16 frontend for Recall Beta.

## Architecture Role

This app is the user-facing interface for the platform. It is responsible for:

- marketing pages
- login and auth entrypoints
- authenticated workspace routes under `/app`
- library, graph, analytics, settings, search, and legal UX
- client-side state management with TanStack Query
- consent handling and cookie-banner flows

See the repository-wide architecture document for the full system view:

- [`../../architecture.md`](../../architecture.md)

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

## Frontend Structure

The app is organized into:

- `app/`: route entrypoints and layouts
- `features/`: feature-scoped APIs, hooks, components, and types
- `providers/`: global query and consent providers
- `lib/`: API client, endpoint registry, env parsing, utilities
- `components/`: shared application and UI components

Important route groups:

- `app/(marketing)`
- `app/(workspace)/app`
- `app/auth/login`

Global providers are registered in `app/layout.tsx`, including:

- query provider
- theme provider
- consent provider
- toast providers

Route protection for `/app` is handled in `proxy.ts` using auth cookies.

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

## API Integration

The frontend uses:

- `lib/api.ts` for request transport and auth-refresh retry behavior
- `lib/api-endpoints.ts` for centralized endpoint mapping
- `lib/query-keys.ts` for consistent React Query cache keys

Feature folders build on those shared layers instead of making raw requests directly from components.

## Notes

- API requests are routed through the shared client helpers in `lib/api.ts`.
- Authenticated document creation uses `POST /api/v1/documents`.
- The root layout currently uses Google font loading for `Geist` and `Sora`; offline builds require local font replacement.
