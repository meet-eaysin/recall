# Recall Architecture

## Overview

Recall is a Yarn 4 + Turborepo monorepo organized into three runtime applications and a shared package layer:

- `apps/web`: Next.js 16 App Router frontend
- `apps/api`: NestJS 11 HTTP API
- `apps/worker`: NestJS 11 async worker and webhook receiver
- `packages/*`: shared runtime and tooling packages

The repository implements a document-first knowledge workspace. The web app handles UI and client-side state, the API handles synchronous business logic and persistence orchestration, and the worker handles asynchronous processing such as ingestion, summaries, transcripts, graph rebuilds, Notion jobs, and email dispatch.

## Architecture Diagram

```text
                         ┌──────────────────────┐
                         │      apps/web        │
                         │ Next.js App Router   │
                         │ TanStack Query UI    │
                         └──────────┬───────────┘
                                    │
                     browser HTTP   │ /api/v1, /auth, /legal
                     + cookies      ▼
                         ┌──────────────────────┐
                         │      apps/api        │
                         │ NestJS HTTP API      │
                         │ Auth / Docs / Search │
                         └───────┬──────┬───────┘
                                 │      │
                         MongoDB │      │ Queue publish
                                 │      ▼
                                 │  ┌───────────────┐
                                 │  │ @repo/queue   │
                                 │  │ qstash | http │
                                 │  └──────┬────────┘
                                 │         │
                                 ▼         ▼
                         ┌────────────┐  ┌──────────────────────┐
                         │ MongoDB    │  │    apps/worker       │
                         │ via Mongoose│ │ NestJS webhook worker│
                         └────────────┘  └──────┬─────┬──────────┘
                                                │     │
                                   internal API │     │ AI/vector/storage/email
                                                ▼     ▼
                                      ┌────────────┐ ┌──────────────┐
                                      │ apps/api   │ │ External svc │
                                      │ internal   │ │ Qdrant/Ollama│
                                      │ endpoints  │ │ Google/Groq  │
                                      └────────────┘ │ Supabase/etc │
                                                     └──────────────┘
```

## Repository Structure

### Root

- `package.json`: workspace scripts and workspace declarations
- `turbo.json`: Turborepo task graph and shared env configuration
- `docker-compose.yml`: local MongoDB, Redis, Qdrant, and Ollama
- `apps/`: deployable applications
- `packages/`: shared runtime and tooling packages

### Applications

#### `apps/web`

Next.js frontend structured around:

- `app/`: App Router entrypoints and route groups
- `features/`: feature-oriented UI, hooks, and API wrappers
- `providers/`: global providers such as query and consent
- `lib/`: env parsing, API client, endpoint registry, utilities
- `components/`: shared UI and application components

Route groups:

- `app/(marketing)`: public marketing and legal pages
- `app/(workspace)/app`: authenticated product pages
- `app/auth/login`: login entrypoint

#### `apps/api`

NestJS backend organized into modules using a layered structure:

- `application/`: use cases and orchestration services
- `domain/`: entities, repository contracts, domain services
- `infrastructure/`: adapters, guards, persistence implementations
- `interface/`: controllers, DTOs, route schemas

Root entry files:

- `src/main.ts`: bootstrap, validation, CORS, Swagger, global prefix
- `src/app.module.ts`: module composition and global providers

Main modules:

- `auth`
- `users`
- `documents`
- `knowledge`
- `search`
- `graph`
- `review`
- `analytics`
- `legal`
- `notion`
- `llm`
- `queue`
- `jobs`
- `health`

#### `apps/worker`

NestJS async worker and webhook receiver with:

- `src/main.ts`: bootstrap and standalone/serverless handler
- `src/worker.module.ts`: root module composition
- worker modules for email, documents, ingestion, graph, notion, llm
- shared internal API client for callbacks into `apps/api`

### Shared Packages

- `packages/ai`: LLM factory, provider registry, Qdrant wrapper, extraction/chunk/summarization pipelines
- `packages/cache`: pluggable cache abstraction for Redis and Upstash
- `packages/crypto`: encryption/decryption helpers used by runtime packages
- `packages/db`: Mongoose connection helpers and exported model/types per domain
- `packages/queue`: pluggable queue abstraction for QStash and HTTP dispatch
- `packages/storage`: pluggable storage abstraction for disk and Supabase
- `packages/types`: shared cross-app runtime contracts
- `packages/eslint-config`, `packages/jest-config`, `packages/typescript-config`: shared tooling presets

## Application Entry Points and Composition

### Web entry

`apps/web/app/layout.tsx` is the frontend composition root. It wraps the app with:

- `QueryProvider`
- `ToastProvider`
- `AnchoredToastProvider`
- `ThemeProvider`
- `ConsentProvider`
- `Toaster`

This makes query state, theme state, consent state, and notifications available globally.

### API entry

`apps/api/src/main.ts` configures:

- `helmet()`
- `cookie-parser`
- CORS with `env.CORS_ORIGIN`
- global `ValidationPipe` with custom validation error formatting
- global prefix `api/v1`
- Swagger outside production

`apps/api/src/app.module.ts` composes root infrastructure and domain modules, and registers:

- `TransformInterceptor` as `APP_INTERCEPTOR`
- `DevUserGuard` or `JwtAuthGuard` as `APP_GUARD`
- `AllExceptionsFilter` as `APP_FILTER`

The API also manages MongoDB lifecycle using `connectMongoDB()` on startup and `disconnectMongoDB()` on shutdown.

### Worker entry

`apps/worker/src/main.ts` bootstraps Nest with `rawBody: true`, initializes the app, exposes a standalone HTTP server in local mode, and exports a serverless-compatible handler.

`apps/worker/src/worker.module.ts` composes:

- `CacheModule.forRoot(...)`
- `QueueModule.forRoot(...)`
- `StorageModule.forRoot(...)`
- `LlmModule`
- `EmailModule`
- `DocumentsModule`
- `IngestionModule`
- `GraphModule`
- `NotionModule`

It also provides `InternalApiClientService` for authenticated internal callbacks back to the API.

## Providers and Services

## Provider Selection Pattern

The codebase uses environment-driven provider selection across infrastructure packages.

### Cache

`@repo/cache` exposes `CacheModule.forRoot()` and supports:

- `redis`
- `upstash`

Binding target:

- `ICacheProvider -> RedisCacheProvider`
- `ICacheProvider -> UpstashCacheProvider`

### Queue

`@repo/queue` exposes `QueueModule.forRoot()` and supports:

- `qstash`
- `http`

Binding target:

- `IQueueProvider -> QStashQueueProvider`
- `IQueueProvider -> HttpQueueProvider`

### Storage

`@repo/storage` exposes `StorageModule.forRoot()` and supports:

- `disk`
- `supabase`

Binding target:

- `IStorageProvider -> DiskStorageProvider`
- `IStorageProvider -> SupabaseStorageProvider`

### Email

The worker email module chooses the email provider through `env.EMAIL_PROVIDER`. Current supported implementation:

- `resend` via `ResendEmailProvider`

### LLM / Embeddings

The API and worker expose `LLMClientFactory` through their `LlmModule`. The factory resolves:

- default provider/model/key from env
- per-provider fallback keys
- user-level persisted LLM configs
- separate embedding provider/model resolution
- provider adapters and base URLs

The provider registry currently includes:

- `ollama`
- `openrouter`
- `groq`
- `google`
- `openai`
- `anthropic`

## API Modules and Interactions

### Auth

`apps/api/src/modules/auth`

Responsibilities confirmed by module wiring:

- session retrieval
- dev login
- OAuth login initiation and callback handling
- refresh flow
- logout and logout-all
- JWT auth strategy and guard
- auth cookie management
- external identity persistence
- refresh session persistence

Dependencies:

- `UsersModule`
- `LegalModule`
- `PassportModule`

### Users

`apps/api/src/modules/users`

Responsibilities:

- current user retrieval
- ensuring dev user presence
- syncing user records from identity sources
- session listing and revocation
- user profile updates
- account deletion
- user LLM settings endpoints

Dependencies:

- `AuthModule`
- `KnowledgeModule`
- `NotionModule`
- `GraphModule`

### Documents

`apps/api/src/modules/documents`

Responsibilities:

- smart-add document creation
- list/get/update/delete documents
- ingestion status lookup
- retry ingestion
- summary operations
- transcript operations

The module is marked `@Global()`, so its repository contracts and use cases can be shared across other modules.

### Knowledge

`apps/api/src/modules/knowledge`

Responsibilities:

- folder CRUD
- folder document listing
- tag CRUD
- tag document listing
- note CRUD

Dependency:

- `DocumentsModule`

### Search

`apps/api/src/modules/search`

Responsibilities:

- standard search
- semantic search
- RAG support
- chat conversation persistence
- ask-style AI flows

Dependencies:

- `DocumentsModule`
- `AnalyticsModule`

### Graph

`apps/api/src/modules/graph`

Responsibilities:

- full graph retrieval
- document subgraph retrieval
- graph rebuild initiation
- graph-building domain logic via `GraphBuilderService`

Dependency:

- `DocumentsModule`

### Review

`apps/api/src/modules/review`

Responsibilities:

- daily review retrieval
- review dismissal
- recommendation retrieval

Dependencies:

- `DocumentsModule`
- `GraphModule`

### Analytics

`apps/api/src/modules/analytics`

Responsibilities:

- statistics retrieval
- heatmap retrieval
- user activity persistence

Dependency:

- `DocumentsModule`

### Legal

`apps/api/src/modules/legal`

Responsibilities:

- legal document retrieval
- consent persistence and lookup

Dependencies:

- `AuthModule`
- `UsersModule`

### Notion

`apps/api/src/modules/notion`

Responsibilities:

- connect/disconnect Notion
- get and update Notion config
- list Notion databases
- trigger sync to Notion

Dependency:

- `DocumentsModule`

### Queue

`apps/api/src/modules/queue`

Responsibilities:

- queue provider setup via `@repo/queue`
- enqueue email use case
- dispatch abstraction through `IEmailQueueDispatcher`

### Jobs

Based on module wiring and file structure, this module exposes internal job-related orchestration through `WorkerJobService` and `InternalJobsController`.

### Health

The API root registers `HealthController` for health endpoints.

## Frontend Structure and Feature Configuration

The frontend uses a feature-sliced structure. Common pattern per feature:

- `api/`: feature-specific API wrapper
- `hooks/`: React Query hooks and state helpers
- `components/`: UI components
- `types/` or `utils/` when needed

Features present in the repository:

- `analytics`
- `auth`
- `graph`
- `home`
- `legal`
- `library`
- `marketing`
- `search`
- `settings`
- `workspace`

### Endpoint configuration

`apps/web/lib/api-endpoints.ts` is the central endpoint registry for:

- documents
- knowledge
- search
- review
- analytics
- auth
- users
- llm settings
- notion
- graph
- legal

### Query configuration

`apps/web/lib/query-keys.ts` centralizes cache key construction for React Query.

### API client behavior

`apps/web/lib/api.ts` is the core frontend transport layer:

- includes credentials on requests
- injects dev auth header when enabled
- retries once on `401` by calling `/auth/refresh`
- parses a standard API envelope (`ApiResponse<T>`)
- throws structured `ApiError`

### Route protection

`apps/web/proxy.ts` protects `/app` routes by checking session cookies and redirecting unauthenticated users to `/auth/login`.

### Consent handling

`apps/web/providers/consent-provider.tsx` globally coordinates:

- consent status loading
- consent modal display for authenticated app users
- cookie banner display for unauthenticated users
- suppression on legal pages

## Worker Responsibilities

The worker handles asynchronous and webhook-based work.

Observed responsibilities from module and controller structure:

- ingestion webhooks
- transcript generation
- summary generation
- graph rebuild jobs
- Notion jobs
- email dispatch jobs

### Internal callback path

`InternalApiClientService` sends authenticated POST requests to the API using:

- `env.API_INTERNAL_URL`
- `x-internal-secret: env.INTERNAL_API_SECRET`

This provides a secure callback path for worker-to-API coordination.

## Data Flow

### Standard frontend to backend flow

```text
Component
  -> feature hook
  -> feature api wrapper
  -> apps/web/lib/api.ts
  -> HTTP request with cookies
  -> API controller
  -> use case / service
  -> repository implementation
  -> MongoDB / external infra
  -> API response envelope
  -> frontend parser
  -> React Query cache
  -> UI update
```

### Auth refresh flow

```text
Request sent with cookies
  -> API returns 401
  -> frontend client calls /auth/refresh
  -> if refresh succeeds, original request is retried once
  -> data or final error is returned to the feature
```

### Async job flow

```text
API use case
  -> @repo/queue provider
  -> QStash or direct HTTP dispatch
  -> worker controller/webhook
  -> async processing
  -> optional callback to API via InternalApiClientService
  -> persisted state update in MongoDB
```

### Search and AI flow

```text
Search request
  -> SearchController
  -> SearchUseCase / AskUseCase
  -> NormalSearchService / SemanticSearchService / RagService
  -> LLMClientFactory + vector infrastructure
  -> Qdrant / provider adapters
  -> response returned and conversation persisted when applicable
```

## Database, API, and External Service Connections

### MongoDB

- primary application database
- connected by API app lifecycle through `@repo/db`
- models exported from `packages/db`
- app-level repositories in `apps/api` wrap those models

### Cache

- provided via `@repo/cache`
- runtime choice: Redis or Upstash

### Queue

- provided via `@repo/queue`
- runtime choice: QStash or HTTP

### Vector Search

- `QdrantWrapper` in `@repo/ai`
- used for semantic search / RAG flows

### LLM Providers

- local: Ollama
- external: Google, Groq, OpenAI, OpenRouter, Anthropic via configured adapters and keys

### Storage

- local disk storage
- Supabase storage

### Notion

- configured through API Notion module and client
- async work handled by worker-side Notion processors

### Email

- worker-side email handling
- current provider implementation: Resend

## Design Decisions Visible in Code

### Monorepo + shared packages

Why this is evident:

- shared runtime packages are consumed across apps
- shared types prevent drift between frontend and backend
- shared infra modules centralize provider selection

### Modular NestJS backend with separated layers

Why this is evident:

- modules consistently split by `application`, `domain`, `infrastructure`, `interface`

This supports clearer boundaries between use cases, contracts, adapters, and transport.

### Feature-sliced frontend

Why this is evident:

- `apps/web/features/*` organizes API wrappers, hooks, components, and types by domain feature

This keeps implementation details close to each product area.

### Environment-driven infrastructure

Why this is evident:

- cache, queue, storage, email, and LLM selection all depend on env-backed configuration

This makes the system deployable across local and hosted environments without changing call sites.

### Dedicated worker for async processing

Why this is evident:

- separate Nest app exists specifically for queued/webhook-driven operations

This separates long-running or asynchronous work from the synchronous API request path.

## Extensibility Notes

### Adding a backend feature module

Follow the existing API pattern:

1. create `apps/api/src/modules/<feature>`
2. add `application`, `domain`, `infrastructure`, `interface`
3. define repository contracts in `domain/repositories`
4. implement adapters in `infrastructure`
5. add controller in `interface`
6. register the module in `AppModule`

### Adding a frontend feature

Follow the existing web pattern:

1. add `apps/web/features/<feature>/api`
2. add `hooks` and `components`
3. register endpoints in `lib/api-endpoints.ts`
4. add React Query keys in `lib/query-keys.ts` if needed
5. expose via App Router pages

### Adding a provider

Current architecture supports explicit extension for:

- cache providers in `@repo/cache`
- queue providers in `@repo/queue`
- storage providers in `@repo/storage`
- LLM providers in `@repo/ai`
- email providers in `apps/worker/src/modules/email`

Each extension point already uses a contract-plus-selection pattern, so new providers can be added by implementing the contract and extending the selection logic.

## Configuration Examples

### API infrastructure configuration

```ts
CacheModule.forRoot({
  provider: env.CACHE_PROVIDER,
  upstash: {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  },
  redis: {
    url: env.REDIS_URL,
  },
});
```

```ts
StorageModule.forRoot({
  provider: env.STORAGE_PROVIDER,
  disk: {
    baseDir: env.FILE_UPLOAD_DIR,
  },
  supabase: {
    url: env.SUPABASE_URL,
    key: env.SUPABASE_KEY,
  },
});
```

### Worker queue configuration

```ts
SharedQueueModule.forRoot({
  provider: env.QUEUE_PROVIDER,
  qstash: {
    token: env.QSTASH_TOKEN,
    baseUrl: env.QSTASH_URL,
    workerUrl: env.WORKER_URL,
    devBypass: env.NODE_ENV === 'development',
  },
  http: {
    baseUrl: env.WORKER_URL,
    devBypassHeader: true,
  },
});
```

### Frontend feature API usage

```ts
export const libraryApi = {
  createDocument: (payload: FormData) =>
    apiPost<{ document: DocumentDetail }>(API_ENDPOINTS.DOCUMENTS.CREATE, {
      body: payload,
    }),
};
```

## Summary

Recall is a modular monorepo with clear boundaries between frontend, synchronous backend, async worker, and shared infrastructure packages. The codebase emphasizes provider abstraction, feature-based organization, and shared contracts across applications.

For further detail, this document can be paired with controller-level API documentation, deployment guides, and flow-specific sequence diagrams.
