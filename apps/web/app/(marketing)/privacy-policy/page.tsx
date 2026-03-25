import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PRIVACY_POLICY_CONTENT = `
# Privacy Policy for Recall

Effective Date: March 26, 2026

## 1. Information We Collect
Recall collects personal knowledge information, including:
- Uploaded documents (PDFs, images, text)
- Extracted transcripts from audio/video
- Vector embeddings of your data (stored in Qdrant)
- Chat interactions with our AI assistant

## 2. How We Use Your Data
Your data is used solely to provide personal knowledge management services. We use:
- OpenRouter and third-party LLM providers to process your queries.
- Persistent storage in MongoDB and Redis for session management.
- Qdrant for semantic search and retrieval.

## 3. Data Sharing and Processing
We do NOT sell your data. Data is shared with AI providers (via OpenRouter) strictly for processing your requests. These providers are bound by their own privacy policies.

## 4. Your Rights
You have the right to:
- Access your data
- Request deletion of your account and all associated data
- Export your knowledge graph

## 5. Contact
For privacy-related inquiries, contact privacy@recall.ai
`;

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      {/* Page Header */}
      <div className="mb-12 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
          Privacy Policy
        </h1>
        <p className="text-sm text-neutral-500">Last updated: March 26, 2026</p>
        <div className="h-px bg-white/10" />
      </div>

      {/* Policy Content */}
      <article className="prose prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:hidden prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-xl prose-h2:text-white prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-base prose-h3:text-white prose-p:text-neutral-400 prose-p:leading-relaxed prose-li:text-neutral-400 prose-strong:text-white prose-a:text-white prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-neutral-300 prose-ul:my-3 prose-li:my-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {PRIVACY_POLICY_CONTENT}
        </ReactMarkdown>
      </article>
    </div>
  );
}
