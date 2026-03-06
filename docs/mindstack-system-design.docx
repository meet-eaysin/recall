🧠  MIND STACK
Complete Product & System Design Document
Turborepo · MongoDB · Qdrant · BullMQ · Local-first · Developer-focused
Version 1.0  ·  March 2026

Table of Contents
1. Product Vision & Design Principles
2. Monorepo Structure (Turborepo)
3. Technology Stack
4. Docker Infrastructure
5. MongoDB Database Design
6. Domain-Driven Folder Structure
7. Content Types & Ingestion — All Edge Cases
8. Document View — What User Sees
9. AI Pipelines (Internal)
10. Knowledge Graph Design
11. Search & Retrieval
12. AI Question Answering (RAG)
13. Daily Review & Recommendations
14. Analytics & Heatmap
15. Notion Integration
16. LLM Provider Configuration
17. Authentication & Security
18. Full API Reference (Every Endpoint)
19. BullMQ Queue Architecture
20. Error Handling & Edge Cases
21. Non-Functional Requirements
22. Environment Variables
23. Out of Scope

1. Product Vision & Design Principles
Mind Stack is a personal, developer-focused AI knowledge system. It acts as a private learning brain where all AI processing is invisible infrastructure, and users interact only with their own documents, notes, folders, tags, and summaries.

1.1 Core Design Principles
Principle	Description
Document-first UX	User sees original document, notes, folders, tags, summary. Never chunks, embeddings, or internal structures.
AI is invisible	All extraction, chunking, embedding, classification pipelines are hidden. User sees only results.
Graph is the knowledge model	All documents belong to a personal knowledge graph rooted at User Brain.
Local-first	Full system runs locally: MongoDB + Qdrant + Redis + Ollama via Docker. No cloud required.
Content rendered as-is	URL → embedded iframe. YouTube → embedded player + optional transcript. PDF → PDF viewer. Image → image viewer. Summary generated only on explicit request.

2. Monorepo Structure (Turborepo)
mindstack/
├── apps/
│   ├── web/                     # Next.js 14 — App Router
│   └── api/                     # Fastify — Node.js backend
├── packages/
│   ├── db/                      # Mongoose schemas (shared)
│   ├── ai/                      # All AI pipeline logic
│   ├── queue/                   # BullMQ job definitions & processors
│   ├── config/                  # Shared ESLint + TypeScript configs
│   └── types/                   # Shared TypeScript interfaces
├── turbo.json
├── package.json                 # Workspace root
└── docker-compose.yml

// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**","dist/**"] },
    "dev":   { "cache": false, "persistent": true },
    "lint":  {},
    "type-check": {}
  }
}

3. Technology Stack
3.1 Frontend — apps/web
Package	Purpose
next@14	App Router, SSR, file-based routing
tailwindcss + shadcn/ui	Utility-first CSS + accessible component library
@xyflow/react	Graph visualization (React Flow) — free, feature-rich
zustand	Lightweight global state (UI state, graph state)
@tanstack/react-query	Server state, cache, mutation handling
react-hook-form + zod	Forms with schema validation
@tiptap/react	Rich text editor for personal notes
react-calendar-heatmap	Activity heatmap display
react-pdf	In-browser PDF viewer for uploaded PDFs
next-auth	Authentication (credentials + future OAuth)

3.2 Backend — apps/api
Package	Purpose
fastify	High-performance web framework
@fastify/jwt + bcryptjs	JWT auth + password hashing
zod	Request/response validation
mongoose	MongoDB ODM with schema enforcement
bullmq	Redis-backed job queue with retry logic
@qdrant/js-client-rest	Vector similarity search client
@extractus/article-extractor	URL content extraction (removes nav/ads/footer)
ytdl-core	YouTube video metadata + audio download
youtube-transcript	YouTube auto-generated/manual transcript extraction
pdf-parse	Text PDF extraction
tesseract.js	OCR for image PDFs and image documents (local, free)
sharp	Image preprocessing before OCR
unified + remark + rehype	Markdown processing pipeline
ollama (npm)	Local Ollama LLM client
openai SDK	OpenAI + OpenRouter + Gemini (all OpenAI-compatible)
@notionhq/client	Notion two-way sync
node crypto (built-in)	AES-256-GCM encryption for API keys — no extra package
p-limit	Concurrency limiter for large document processing
langdetect	Language detection for extracted content

4. Docker Infrastructure (All Free, All Local)
Image	Purpose
mongo:7	Main database — all structured data
redis:7-alpine	BullMQ queue backend + session cache
qdrant/qdrant	Vector store for document embeddings
ollama/ollama	Local LLM for chat + local embeddings

version: "3.9"
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]
    environment:
      MONGO_INITDB_DATABASE: mindstack

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

  qdrant:
    image: qdrant/qdrant
    ports: ["6333:6333"]
    volumes: ["qdrant_data:/qdrant/storage"]

  ollama:
    image: ollama/ollama
    ports: ["11434:11434"]
    volumes: ["ollama_data:/root/.ollama"]

volumes:
  mongo_data:
  qdrant_data:
  ollama_data:

5. MongoDB Database Design
All collections are strictly per-user. Every document query includes userId as the first filter.

5.1 users
{
  _id: ObjectId,
  email: String,            // unique, indexed
  passwordHash: String,     // bcrypt, never returned to client
  name: String,
  rootNodeId: ObjectId,     // ref: graph_nodes (user brain root)
  preferences: {
    defaultStatus: String,  // default document status on add
    dailyReviewEnabled: Boolean,
    language: String,       // preferred UI language
  },
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { email: 1 } unique

5.2 documents
{
  _id: ObjectId,
  userId: ObjectId,         // indexed

  // ── User-visible fields ──────────────────────────────
  title: String,
  type: 'url' | 'youtube' | 'pdf' | 'image' | 'text',
  originalSource: String,   // original URL or filename
  status: 'to_read' | 'to_watch' | 'in_process' | 'review'
        | 'upcoming' | 'completed' | 'pending_completion',

  // ── Rendering (what user sees) ──────────────────────
  // URL:     originalSource is embedded as iframe
  // YouTube: originalSource (youtube URL) is embedded as player
  //          transcript stored separately in document_transcripts
  // PDF:     fileRef points to stored file → rendered via react-pdf
  // image:   fileRef points to stored image → rendered inline
  // text:    renderedMarkdown shown directly
  fileRef: String | null,   // local file path for pdf/image
  renderedMarkdown: String | null, // for text type only
  summary: String | null,   // ONLY set after user clicks Generate Summary

  // ── Metadata ────────────────────────────────────────
  author: String | null,
  publishedAt: Date | null,
  language: String,         // ISO 639-1, auto-detected
  wordCount: Number | null,
  estimatedReadMinutes: Number | null,

  // ── Organization ────────────────────────────────────
  folderIds: [ObjectId],    // ref: folders (many-to-many)
  tagIds:    [ObjectId],    // ref: tags

  // ── Timestamps ──────────────────────────────────────
  createdAt: Date,
  updatedAt: Date,
  lastOpenedAt: Date | null,

  // ── INTERNAL (never sent to frontend) ───────────────
  ingestionStatus: 'pending' | 'processing' | 'completed' | 'failed',
  ingestionError: String | null,
  ingestionAttempts: Number,
  embeddingsReady: Boolean,
  ocrConfidence: Number | null,   // avg OCR confidence (0-100)
  extractedTextLength: Number | null,
  chunkCount: Number | null,
}
Indexes:
    • { userId: 1, createdAt: -1 }
    • { userId: 1, status: 1 }
    • { userId: 1, folderIds: 1 }
    • { userId: 1, ingestionStatus: 1 }
    • { userId: 1, lastOpenedAt: -1 }
    • { title: 'text' }  — full-text search on title

5.3 folders
{
  _id: ObjectId,
  userId: ObjectId,   // indexed
  name: String,
  description: String | null,
  createdAt: Date,
  updatedAt: Date
}
// Index: { userId: 1, name: 1 }

5.4 tags
{
  _id: ObjectId,
  userId: ObjectId,
  name: String,
  source: 'user' | 'ai',
  createdAt: Date
}
// Index: { userId: 1, name: 1 } unique

5.5 notes
{
  _id: ObjectId,
  userId: ObjectId,
  documentId: ObjectId,   // indexed
  content: String,        // TipTap HTML
  createdAt: Date,
  updatedAt: Date
}
// Index: { documentId: 1, createdAt: -1 }

5.6 document_chunks (INTERNAL — never exposed to frontend)
{
  _id: ObjectId,
  documentId: ObjectId,     // indexed
  userId: ObjectId,         // indexed (for cleanup)
  chunkIndex: Number,
  content: String,          // raw text of chunk
  qdrantPointId: String,    // pointer to Qdrant — embeddings live there
  tokenCount: Number,
  headingContext: String | null,  // nearest heading above this chunk
  pageNumber: Number | null,      // for PDF chunks
  createdAt: Date
}
// Indexes: { documentId: 1, chunkIndex: 1 }, { userId: 1 }

5.7 document_transcripts (YouTube only — INTERNAL)
{
  _id: ObjectId,
  documentId: ObjectId,   // indexed
  userId: ObjectId,
  segments: [{
    start: Number,   // seconds
    duration: Number,
    text: String
  }],
  fullText: String,       // concatenated for chunking
  language: String,
  source: 'auto' | 'manual' | 'generated',
  createdAt: Date
}

5.8 graph_nodes
{
  _id: ObjectId,
  userId: ObjectId,         // indexed
  type: 'root' | 'document',
  documentId: ObjectId | null,  // null for root node
  label: String,            // display label in graph
  createdAt: Date
}
// Index: { userId: 1 }, { userId: 1, documentId: 1 } unique

5.9 graph_edges
{
  _id: ObjectId,
  userId: ObjectId,
  fromNodeId: ObjectId,     // always the more central / parent node
  toNodeId: ObjectId,
  relationType: 'root_connection'     // doc → root (fallback)
              | 'semantic_similarity' // high embedding cosine similarity
              | 'topical'             // shared topic cluster
              | 'shared_tags',        // same user tags
  weight: Number,           // 0.0 – 1.0 (similarity score)
  generationMethod: 'embedding' | 'topic_overlap' | 'shared_tags' | 'default_root',
  createdAt: Date
}
// Indexes: { userId: 1, fromNodeId: 1 }, { userId: 1, toNodeId: 1 }

5.10 ingestion_jobs
{
  _id: ObjectId,
  documentId: ObjectId,
  userId: ObjectId,
  bullJobId: String,
  stage: 'queued' | 'extract' | 'normalize' | 'embed' | 'graph' | 'done' | 'failed',
  stages: [{
    name: String,
    status: 'pending' | 'running' | 'done' | 'failed',
    startedAt: Date | null,
    completedAt: Date | null,
    error: String | null
  }],
  attempts: Number,
  maxAttempts: Number,
  lastError: String | null,
  createdAt: Date,
  updatedAt: Date
}

5.11 llm_configs
{
  _id: ObjectId,
  userId: ObjectId,   // unique index
  provider: 'ollama' | 'openai' | 'openrouter' | 'gemini',
  chatModel: String,
  embeddingModel: String,
  encryptedApiKey: String | null,  // AES-256-GCM encrypted, never sent to frontend
  baseUrl: String | null,
  capabilities: {
    chat: Boolean,
    embeddings: Boolean
  },
  validatedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}

5.12 notion_configs
{
  _id: ObjectId,
  userId: ObjectId,
  encryptedAccessToken: String,   // encrypted
  workspaceId: String,
  targetDatabaseId: String,
  lastSyncedAt: Date | null,
  syncEnabled: Boolean,
  syncDirection: 'push' | 'both',  // push = mindstack → notion only
  createdAt: Date
}

5.13 user_activity
// Append-only log — powers heatmap and smart resurfacing
{
  _id: ObjectId,
  userId: ObjectId,         // indexed
  documentId: ObjectId,     // indexed
  action: 'opened' | 'note_created' | 'summary_generated' | 'added',
  date: Date,               // store as start-of-day UTC for heatmap grouping
  createdAt: Date
}
// Indexes: { userId: 1, date: -1 }, { userId: 1, documentId: 1 }

6. Domain-Driven Folder Structure
apps/api/src/
├── domains/
│   ├── auth/
│   ├── documents/
│   ├── folders/
│   ├── tags/
│   ├── notes/
│   ├── graph/
│   ├── search/
│   ├── ask/
│   ├── review/
│   ├── recommendations/
│   ├── analytics/
│   ├── llm-config/
│   └── notion/
├── infrastructure/
│   ├── db/                      # Mongoose connection
│   ├── queue/                   # BullMQ setup
│   ├── qdrant/                  # Qdrant client
│   └── crypto/                  # Encryption helpers
├── middleware/
│   ├── auth.middleware.ts
│   ├── rateLimit.ts
│   └── errorHandler.ts
├── utils/
│   └── response.ts              # Standard response envelope
└── server.ts

packages/ai/src/
├── providers/
│   ├── ollama.provider.ts
│   ├── openai.provider.ts
│   └── provider.factory.ts      # Returns correct LLM client
├── pipelines/
│   ├── extract/
│   │   ├── url.extractor.ts
│   │   ├── youtube.extractor.ts
│   │   ├── pdf.extractor.ts     # handles text PDF + image PDF + huge PDFs
│   │   ├── image.extractor.ts
│   │   └── text.normalizer.ts
│   ├── chunk.pipeline.ts
│   ├── embed.pipeline.ts
│   ├── summarize.pipeline.ts
│   ├── qa.pipeline.ts           # RAG
│   ├── graph.pipeline.ts
│   └── classify.pipeline.ts     # Tags + topics
└── index.ts

7. Content Types & Ingestion — All Edge Cases
7.1 URL Documents
What the user sees: the original URL is rendered as an iframe embed in the document detail page. The user reads the actual website, not extracted text.

Extraction Pipeline (Internal)
    1. Fetch raw HTML with timeout (15s, retry 3x)
    2. Run @extractus/article-extractor to strip nav, ads, sidebars, related links, footer
    3. If extractor fails or returns < 300 chars, fall back to Readability.js (Mozilla)
    4. Convert article HTML → clean Markdown via rehype
    5. Detect language
    6. Store as renderedMarkdown internally for chunking only

Edge Cases — URL
⚠  Edge Cases to Handle
JavaScript-rendered pages (SPAs): article-extractor handles most; for failures, store title + URL only and mark ingestionStatus = 'partial'
Paywalled content: extraction returns minimal text; store what we get, flag as partial
Redirect chains: follow up to 5 redirects, timeout at 15s
Dead link: mark ingestionStatus = 'failed', ingestionError = 'URL unreachable', user can retry
Very long articles (50,000+ words): chunk all of it, no truncation — only embedding and QA use chunks
Non-article pages (tools, apps): extractor returns little content; store URL + title, skip embedding if < 100 chars extracted
Side content / related links / ads extracted by mistake: article-extractor + Readability handles this; the internal extracted text is never shown to user — so even imperfect extraction only affects RAG quality, not UX
Duplicate URL added: system checks originalSource uniqueness per user, returns 409 with existing document ID

7.2 YouTube Videos
What the user sees: the YouTube video is embedded as a standard YouTube iframe player. The user watches the video directly. Optionally, the user can click 'Convert to Text' to generate a readable transcript.

Extraction Pipeline (Internal)
    7. Extract video ID from URL (handles all YouTube URL formats)
    8. Fetch video metadata: title, channel, description, publishedAt, duration
    9. Attempt to fetch transcript via youtube-transcript (auto-captions or manual)
    10. If transcript unavailable, mark transcriptSource = 'none', skip embedding — video is still saved
    11. Chunk transcript text and embed for RAG

User Action: Convert to Text
When user explicitly clicks 'Video to Text': fetch transcript if not already done, format as readable text with timestamps, display in a panel alongside the video player.

Edge Cases — YouTube
⚠  Edge Cases to Handle
No transcript available: save video with transcriptSource = 'none', skip embedding, document still accessible
Private / deleted video: ytdl-core returns error; mark ingestionStatus = 'failed'
Very long video (3+ hours): transcript can be 50,000+ words; chunk all of it, no truncation
Non-English transcript: detect language, chunk and embed same way
Live streams: no transcript available; treat same as 'no transcript'
Age-restricted video: ytdl-core may fail; mark as failed, user can retry
Invalid YouTube URL: validate URL format before queuing, return 400 immediately

7.3 PDF Documents
What the user sees: the PDF is rendered using react-pdf viewer in the browser, exactly as uploaded. No extracted text, no modified content.

PDF Type Detection (Internal)
PDFs come in two forms: text PDFs (have embedded text) and image PDFs (scanned documents — only pixel data, no text layer).
async function detectPdfType(buffer: Buffer): Promise<'text' | 'image' | 'mixed'>  {
  const result = await pdfParse(buffer, { max: 5 }); // check first 5 pages
  const textLength = result.text.trim().length;
  const pageCount = result.numpages;
  if (textLength < 100 * pageCount) return 'image'; // < 100 chars/page = image PDF
  if (textLength < 300 * pageCount) return 'mixed';
  return 'text';
}

Text PDF Pipeline
    12. pdf-parse to extract text with page boundaries
    13. Normalize whitespace, remove headers/footers heuristically
    14. Chunk by page + semantic boundaries
    15. Embed all chunks

Image PDF Pipeline (Scanned / Image-only)
    16. Convert each page to image using pdf-to-img or poppler (docker available)
    17. Run tesseract.js OCR on each page image
    18. Confidence check: pages with < 40% OCR confidence are flagged
    19. Concatenate OCR text, store ocrConfidence average on document
    20. Chunk and embed as normal

Edge Cases — PDF (Critical)
⚠  Large PDF Edge Cases
500-page PDF: do NOT load entire PDF into memory at once. Stream and process page-by-page in batches of 10 pages using p-limit(2) concurrency. Estimated 500-page text PDF ≈ 2-5 minutes. Image PDF ≈ 15-30 minutes.
Image PDF 500 pages: OCR is CPU-intensive. Process in background job. Show UI progress via polling. User can open document (PDF viewer works immediately) while embedding is still running.
Mixed PDF (some pages text, some scanned): process each page with the appropriate method
Password-protected PDF: pdf-parse throws; catch error, mark ingestionStatus = 'failed', ingestionError = 'PDF is password protected'
Corrupted PDF: pdf-parse throws; mark as failed
PDF with only images (no text, not scanned — e.g. charts, figures): OCR returns low confidence; store what we get, flag extractedTextLength
Large file size (>100MB): reject at upload middleware with 413 error before queuing
PDF with 1000+ embedded images: skip image extraction from within PDF, only extract text layer
Non-UTF8 text encoding in old PDFs: pdf-parse handles encoding; fallback to replace invalid chars

7.4 Image Documents
What the user sees: the image is displayed directly using a standard HTML img tag or image viewer. No extracted content is shown.

Extraction Pipeline (Internal)
    21. sharp to auto-orient, resize if > 4000px on any axis (for OCR performance)
    22. tesseract.js OCR — returns text + confidence per word
    23. If confidence < 40% average: store what we have, flag in ocrConfidence
    24. If extracted text > 100 chars: chunk and embed
    25. If extracted text < 100 chars: skip embedding, document still saved

Edge Cases — Image
⚠  Edge Cases to Handle
Pure diagram with no text: OCR returns nothing; store image, skip embedding — still fully usable
Handwritten notes: OCR accuracy is low; extract what we can, user sees original image anyway
Very large image (50MB+): reject at upload if > 20MB, or resize before OCR
Screenshot of code: OCR attempts extraction; quality may be low — user sees original screenshot
Multi-language image: tesseract supports multiple languages simultaneously

7.5 Plain Text
What the user sees: the text content is rendered as Markdown in the document detail page.

Pipeline
    26. Receive text input directly from API
    27. Normalize line endings, trim
    28. Convert plain text → Markdown (preserve any existing Markdown syntax)
    29. Store as renderedMarkdown
    30. Chunk and embed

8. Document View — What User Sees
8.1 Document List Page
Displays a card/table of all user's documents. Each row shows:
Field	Description
Title	Document title (editable inline)
Type icon	url / youtube / pdf / image / text — visual icon only
Status badge	Current status with color coding
Folders	Folder pills
Tags	Tag pills (user + AI generated)
Created date	Human-readable relative date
Last opened	Time since last opened

8.2 Document Detail Page — Per Type
URL type
    • Header: title, metadata (author, publishedAt if extracted), status, tags, folders
    • Main area: the original URL is embedded as <iframe src={originalSource} />
    • If iframe is blocked (X-Frame-Options): show 'Open in new tab' button prominently
    • Sidebar: personal notes editor, generated summary (if exists)

YouTube type
    • Header: title, channel, duration, status, tags, folders
    • Main area: <iframe src={youtube embed URL} /> — standard YouTube player
    • 'Convert to Text' button: triggers transcript display panel
    • Transcript panel (after conversion): scrollable, timestamp-linked, search within transcript
    • Sidebar: personal notes, generated summary (if exists)

PDF type
    • Header: title, page count, status, tags, folders
    • Main area: react-pdf viewer rendering the actual uploaded PDF
    • PDF controls: page navigation, zoom, full-screen
    • Sidebar: personal notes, generated summary (if exists)
    • 'Generate Summary' button always visible

Image type
    • Header: title, status, tags, folders
    • Main area: <img> tag rendering the uploaded image, zoom controls
    • Sidebar: personal notes, generated summary (if exists)

Text type
    • Header: title, word count, estimated read time, status, tags, folders
    • Main area: rendered Markdown from renderedMarkdown field
    • Sidebar: personal notes, generated summary (if exists)

⚠  Important: Summary Generation
Summary is NEVER auto-generated. User must explicitly click 'Generate Summary'.
Before summary exists: sidebar shows 'Generate Summary' button only.
After summary generated: summary text is shown below the button, with a 'Regenerate' option.
Summary is generated from internal extracted text (not shown to user) via LLM.

9. AI Pipelines (Internal — Never Exposed to User)
9.1 Full Ingestion Pipeline
User adds document
  └─ API: create document record (ingestionStatus: 'pending')
  └─ Push job to ingestion-queue
       └─ [Stage 1: extract]
       │    URL:      fetch + article-extractor → clean markdown
       │    YouTube:  ytdl-core metadata + youtube-transcript
       │    PDF:      detect type → text extraction OR OCR pipeline
       │    Image:    sharp preprocessing → tesseract.js OCR
       │    Text:     normalize → store renderedMarkdown
       │    On error: retry up to 3x, then mark failed
       │
       └─ [Stage 2: classify]
       │    LLM call: extract topics, suggest tags
       │    Upsert tags (ai-sourced) → link to document
       │
       └─ [Stage 3: chunk]
       │    Split text into chunks (512 tokens, 50 token overlap)
       │    Store chunks in document_chunks
       │
       └─ [Stage 4: embed]
       │    Embed each chunk via configured provider
       │    Upsert all chunk vectors into Qdrant
       │    (payload: { documentId, userId, chunkIndex })
       │    document.embeddingsReady = true
       │
       └─ [Stage 5: graph-update]
            query Qdrant for top-5 similar documents (same userId)
            for each similar doc with weight > 0.65:
              upsert graph_edge (semantic_similarity)
            check shared tags → upsert graph_edge (shared_tags)
            if no edges found: upsert root_connection edge
            if edges found: upsert root_connection edge ALSO
               (every doc connects to root + its related docs)

9.2 Chunking Strategy
// Semantic-aware chunking with overlap
const CHUNK_SIZE   = 512;  // tokens
const CHUNK_OVERLAP = 50;  // tokens

// For PDFs: chunk by page first, then by token limit within page
// For long text/URL: sliding window with heading-aware boundaries
// headingContext stored per chunk to aid RAG context building

// Large document safeguard:
// 500-page PDF ≈ ~250,000 tokens → ~500 chunks
// Process with p-limit(3) concurrency, batch Qdrant upserts in 50s

10. Knowledge Graph Design
10.1 Graph Structure
Every user has exactly one root node called 'User Brain'. All documents eventually connect to this root. Documents that are related to each other also connect directly to each other.

                    [User Brain / Root]
                   /        |          \
           [Doc A]      [Doc B]       [Doc E]
           /    \          |
       [Doc C] [Doc D]  [Doc F]

Rules:
  - EVERY document connects to User Brain root
  - If Doc A is similar to Doc C: edge A → C (semantic_similarity)
  - If Doc A has no similar docs: connects to root ONLY
  - If Doc A has similar docs: connects to similar docs + ALSO to root
  - Edges are directional from 'more central' to 'less central'
  - Root always has all documents connected to it

10.2 Graph Pipeline — Relationship Discovery
Relation Type	Logic
semantic_similarity	Qdrant similarity search: if avg embedding cosine > 0.65 between two documents, create edge. Weight = similarity score.
topical	Two documents share 2+ AI-generated topic tags. Weight = shared_topics / total_topics.
shared_tags	Two documents share 1+ user-created tags. Weight = 0.5 (fixed, user-defined relation).
root_connection	Fallback: every document always has an edge to root. Weight = 0.1.

10.3 Graph Visualization
User sees an interactive graph using React Flow (@xyflow/react). Root node is center. Documents radiate outward. Edge thickness = weight. Edge color = relation type. User can:
    • Pan and zoom the graph
    • Click a node to see document title + quick link to document
    • Hover an edge to see relation type and weight
    • Toggle edge types (show/hide semantic, topical, shared_tags)
    • Focus mode: click a document → shows only that document and its direct connections
Graph is read-only in this version.

11. Search & Retrieval
11.1 Normal Search
Search Type	Implementation
Title search	MongoDB $text index on title — full-text match
Tag filter	Filter by tagIds array: { tagIds: { $in: [tagId] } }
Folder filter	Filter by folderIds array: { folderIds: { $in: [folderId] } }
Status filter	Exact match on status field
Type filter	Exact match on type field
Date range	createdAt / lastOpenedAt range filter
Combined filters	All filters can be combined in one query

11.2 AI-Powered (Semantic) Search
1. Embed the user's query using configured embedding model
2. Qdrant search: filter by userId, return top-10 similar chunks
3. Deduplicate by documentId (multiple chunks may match same doc)
4. Fetch document titles + metadata from MongoDB
5. Return: ranked document list with relevance score
   (document-level result only — no chunk content shown to user)
6. Short preview: first 150 chars of renderedMarkdown (text type)
   or document description (URL/YouTube) shown as search result preview

12. AI Question Answering (RAG)
12.1 Full RAG Flow
User submits question: 'Explain transformer attention using my documents'

1. Embed question → vector
2. Qdrant search: filter { userId }, top-K = 8 most similar chunks
3. Fetch full chunk content from document_chunks
4. Fetch document metadata: title, author, originalSource, publishedAt
5. Deduplicate: if 3 chunks from same doc, keep best 2
6. Build context string:
   [Source: {title} - {author} - {date}]
   {chunk content}
   ---
   (repeat for each chunk)
7. LLM prompt:
   'Answer the user's question ONLY using the provided context.
    If the answer is not in the context, say so.'
8. Return: { answer: string, sources: [{ documentId, title, author,
     publishedAt, originalSource }] }

12.2 Source Attribution
Every answer MUST include a sources section showing:
Field	Purpose
documentId	For frontend to link to the document
title	Document title
author	Author if available
publishedAt	Publication date if available
originalSource	URL or filename

12.3 Edge Cases — RAG
⚠  Edge Cases
No documents with embeddings yet: return message 'Add and process some documents first to use Ask AI'
Question unrelated to any document: Qdrant returns low scores; LLM should say 'I could not find relevant information in your documents'
User asks about a document still ingesting: filter to embeddingsReady: true only
LLM provider unavailable: return 503 with clear message
Context too long for LLM context window: trim to fit, prioritize highest-scoring chunks

13. Daily Review & Recommendations
13.1 Daily Review Logic
GET /review/daily returns a curated list of documents for the user to revisit today. Selection algorithm:
    31. Documents with status 'in_process' or 'review' — highest priority
    32. Documents not opened in 7+ days with high graph centrality (many connections)
    33. Documents from same graph cluster as recently opened documents
    34. Documents with notes activity in last 30 days
    35. Max 10 documents returned, sorted by priority score

13.2 Recommendation Logic
GET /recommendations suggests new content based on user's existing documents.
    36. Extract top topics from AI-generated tags across all user documents
    37. Identify gaps: topic clusters in graph with few documents
    38. Return up to 5 related documents the user already owns (from graph cluster neighbors)
    39. Optionally: suggest external search queries (just keyword strings, no external API)

14. Analytics & Activity Heatmap
14.1 Heatmap Data
GET /analytics/heatmap returns daily activity counts for the past 365 days.
// Response structure
{
  heatmap: [
    { date: '2026-01-15', count: 4, breakdown: { added: 1, opened: 2, notes: 1 } },
    ...
  ],
  summary: {
    totalDocuments: 142,
    totalNotes: 38,
    currentStreak: 5,   // days
    longestStreak: 14,
    mostActiveDay: '2026-01-10'
  }
}

15. Notion Integration
15.1 Setup Flow
    40. User goes to Settings → Notion
    41. POST /notion/connect with access_token (user copies from Notion integration)
    42. System validates token, fetches workspace info
    43. User selects target Notion database from list
    44. System stores encrypted token + databaseId

15.2 Sync Behavior
When a document is added in Mind Stack, a corresponding page is created in the selected Notion database. Fields synced:
Mind Stack field	Notion property
Title	Document title
Type	Select property
Status	Select property
Source URL	URL property
Tags	Multi-select property
Folders	Multi-select property
Summary	Rich text (if generated)
Created date	Date property

15.3 Edge Cases — Notion
⚠  Notion Edge Cases
Token expired: catch 401 from Notion API, mark syncEnabled = false, notify user
Target database deleted: catch 404, mark syncEnabled = false
Notion rate limit (3 req/sec): implement queue with rate limiting in notion-sync job
Large initial sync (500+ documents): process in batches of 10, show progress
Network timeout: BullMQ retry with exponential backoff

16. LLM Provider Configuration
16.1 Supported Providers
Provider	Details
ollama	Local Ollama — default. baseUrl = http://localhost:11434. No API key needed.
openai	OpenAI API. Requires API key. baseUrl optional (for proxies).
openrouter	OpenRouter — OpenAI-compatible. Requires API key. baseUrl = https://openrouter.ai/api/v1
gemini	Google AI Studio — OpenAI-compatible via SDK. Requires API key.

16.2 Validation Flow
POST /llm-config/validate: before saving, the system tests the model with a simple chat completion AND an embedding call. Reports which capabilities succeeded or failed.

16.3 API Key Security
// AES-256-GCM encryption — Node.js built-in crypto
// ENCRYPTION_KEY env var (32-byte hex string)

encrypt(plaintext: string): string
  → iv:ciphertext:authTag  (base64 encoded, colon-separated)

decrypt(ciphertext: string): string

// API keys are NEVER:
//   - stored in plaintext in DB
//   - sent to frontend
//   - logged

17. Authentication & Security
17.1 Auth Flow
JWT-based authentication. Tokens stored in httpOnly cookies.
Action	Description
Registration	POST /auth/register → hash password with bcrypt (rounds=12) → create user + root graph node → return JWT
Login	POST /auth/login → verify password → return JWT in httpOnly cookie
Token refresh	POST /auth/refresh → validate refresh token → return new access token
Logout	POST /auth/logout → clear cookie
Get profile	GET /auth/me → return user profile (no passwordHash)

17.2 Security Rules
    • Every API route (except /auth/*) requires valid JWT
    • Every DB query includes userId filter — users can never access other users' data
    • File uploads validated: mime type + magic bytes check
    • Rate limiting: 100 requests/15min per IP on auth endpoints
    • API keys encrypted at rest, never returned to frontend
    • Notion tokens encrypted at rest

18. Full API Reference
All responses follow standard envelope: { success: boolean, data: any, error?: string }

18.1 Auth
Endpoint	Body / Params	Response
POST /auth/register	{ email, password, name }	{ user, token }
POST /auth/login	{ email, password }	{ user, token }
POST /auth/refresh	cookie: refreshToken	{ token }
POST /auth/logout	—	200 OK
GET  /auth/me	—	{ user }
PATCH /auth/me	{ name, preferences }	{ user }
PATCH /auth/me/password	{ currentPassword, newPassword }	200 OK

18.2 Documents
Endpoint	Body / Params	Response
GET    /documents	?status&type&folder&tag&page&limit	{ documents[], total, page }
POST   /documents	{ type, source, title?, status?, folderIds?, tagIds? }	{ document }
GET    /documents/:id	—	{ document }
PATCH  /documents/:id	{ title?, status?, folderIds?, tagIds? }	{ document }
DELETE /documents/:id	—	204 No Content
POST   /documents/:id/summary	—	{ summary }  (triggers pipeline)
DELETE /documents/:id/summary	—	200 OK (clears summary)
GET    /documents/:id/status	—	{ ingestionStatus, stage, embeddingsReady }
POST   /documents/:id/retry	—	{ jobId }  (retry failed ingestion)
GET    /documents/:id/transcript	YouTube only	{ segments[], fullText }
POST   /documents/:id/transcript	YouTube: generate/fetch transcript	{ transcript }

18.3 Folders
Endpoint	Body / Params	Response
GET    /folders	—	{ folders[] }
POST   /folders	{ name, description? }	{ folder }
GET    /folders/:id	—	{ folder, documentCount }
PATCH  /folders/:id	{ name?, description? }	{ folder }
DELETE /folders/:id	—	204 (documents unlinked, not deleted)
GET    /folders/:id/documents	?page&limit	{ documents[], total }

18.4 Tags
Endpoint	Body / Params	Response
GET    /tags	—	{ tags[] }
POST   /tags	{ name }	{ tag }
PATCH  /tags/:id	{ name }	{ tag }
DELETE /tags/:id	—	204 (removed from all documents too)
GET    /tags/:id/documents	?page&limit	{ documents[] }

18.5 Notes
Endpoint	Body / Params	Response
GET    /notes	?documentId (required)	{ notes[] }
POST   /notes	{ documentId, content }	{ note }
GET    /notes/:id	—	{ note }
PATCH  /notes/:id	{ content }	{ note }
DELETE /notes/:id	—	204

18.6 Graph
Endpoint	Body / Params	Response
GET  /graph	—	{ nodes[], edges[], rootNodeId }
GET  /graph/document/:docId	—	{ node, directEdges[], neighborNodes[] }

18.7 Search & Ask
Endpoint	Body / Params	Response
GET  /search	?q&mode=normal|ai&status&type&folder&tag	{ documents[], total }
POST /ask	{ question, documentIds?: [] }	{ answer, sources[] }

18.8 Review & Recommendations
Endpoint	Body / Params	Response
GET  /review/daily	—	{ documents[], reason[] }
POST /review/dismiss/:docId	—	200 (dismiss from today's review)
GET  /recommendations	—	{ ownedDocuments[], suggestedTopics[] }

18.9 Analytics
Endpoint	Body / Params	Response
GET  /analytics/heatmap	?days=365	{ heatmap[], summary }
GET  /analytics/stats	—	{ totalDocs, byType, byStatus, totalNotes }

18.10 LLM Config
Endpoint	Body / Params	Response
GET  /llm-config	—	{ config (no apiKey) }
PUT  /llm-config	{ provider, model, apiKey?, baseUrl? }	{ config }
POST /llm-config/validate	{ provider, model, apiKey?, baseUrl? }	{ chat: bool, embeddings: bool }
DELETE /llm-config	—	204 (resets to Ollama default)

18.11 Notion
Endpoint	Body / Params	Response
GET    /notion/config	—	{ config (no token) }
POST   /notion/connect	{ accessToken, databaseId }	{ config }
GET    /notion/databases	—	{ databases[] }  (list user's Notion DBs)
PATCH  /notion/config	{ syncEnabled?, databaseId? }	{ config }
POST   /notion/sync	—	{ jobId }  (manual full sync)
DELETE /notion/config	—	204

19. BullMQ Queue Architecture
19.1 Queue Definitions
Queue	Description
ingestion-queue	Main pipeline: extract → classify → chunk → embed → graph. Concurrency: 2. Retry: 3x with exponential backoff.
summary-queue	User-triggered summary generation. Concurrency: 3. Retry: 2x.
graph-queue	Relationship re-computation triggered after new document embedding completes. Concurrency: 1.
notion-sync-queue	Triggered on document create/update. Rate-limited to 3 req/sec. Concurrency: 1.
review-cron	Daily cron at 6:00 AM UTC. Computes daily review list and caches in Redis.

19.2 Job Progress Reporting
Frontend polls GET /documents/:id/status every 3 seconds while ingestionStatus is pending/processing. Response includes current stage name so UI can show progress steps.

20. Error Handling & Edge Cases
20.1 Standard Error Response
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document not found",
    "details": {}
  }
}

20.2 Error Codes
Code	Meaning + HTTP Status
VALIDATION_ERROR	Request body failed zod schema — 400
UNAUTHORIZED	Missing or invalid JWT — 401
FORBIDDEN	Document belongs to another user — 403
DOCUMENT_NOT_FOUND	Document ID not found — 404
DUPLICATE_SOURCE	URL already added by this user — 409
FILE_TOO_LARGE	Upload exceeds 100MB limit — 413
UNSUPPORTED_FILE_TYPE	File type not allowed — 415
INGESTION_FAILED	Background pipeline failed — 422
LLM_UNAVAILABLE	LLM provider unreachable — 503
NOTION_SYNC_FAILED	Notion API error — 502
RATE_LIMITED	Too many requests — 429
PDF_PASSWORD_PROTECTED	Cannot process locked PDF — 422
YOUTUBE_NO_TRANSCRIPT	No transcript available for video — 200 (partial success)

21. Non-Functional Requirements
Area	Requirement
Performance	Document search < 500ms. Graph load: incremental. Ingestion: fully async (never blocks UI). Large PDF: process in batches.
Reliability	All BullMQ jobs are idempotent. Failed jobs leave document in failed state, never corrupt data. Retry policies on all external calls.
Security	API keys encrypted at rest. Never logged. Never sent to frontend. Per-user data isolation enforced at DB query level.
Privacy	User data never used for training. LLM providers receive only the minimum text needed.
Extensibility	New document types: add extractor + register in type enum. New LLM providers: implement provider interface. New relation types: add to enum.
Observability	Structured logs for: ingestion start/end/failure, embedding job, graph computation, provider errors, Notion sync.
Local-first	Full system must run with zero cloud dependencies: local MongoDB + Qdrant + Redis + Ollama via Docker.
API consistency	All APIs: standard envelope, standard error schema, zod-validated inputs.

22. Environment Variables
# apps/api/.env
MONGODB_URI=mongodb://localhost:27017/mindstack
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
OLLAMA_URL=http://localhost:11434

JWT_SECRET=<random-64-char-hex>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<random-64-char-hex>
REFRESH_TOKEN_EXPIRES_IN=30d

ENCRYPTION_KEY=<random-32-byte-hex>          # for AES-256-GCM

FILE_UPLOAD_DIR=./uploads                     # local file storage
MAX_FILE_SIZE_MB=100

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=<random-64-char-hex>
NEXTAUTH_URL=http://localhost:3000

23. Out of Scope (Current Phase)
Feature	Status
Public sharing	Documents are private to each user
Collaboration	No multi-user document sharing
Social features	No follows, likes, or comments between users
Marketplace	No document selling or monetization
Publishing	No blog or public profile export
Mobile app	Web-only in this phase
Real-time sync	No WebSocket live updates (polling instead)
Graph editing	Graph is read-only; users cannot manually add/remove edges
Custom embedding models	Only via configured LLM provider

Mind Stack — Complete System Design  ·  v1.0  ·  March 2026
Turborepo · Next.js 14 · Fastify · MongoDB · Qdrant · BullMQ · Ollama
Turborepo · Next.js 14 · Fastify · MongoDB · Qdrant · BullMQ · Ollama