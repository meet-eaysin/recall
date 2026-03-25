import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const COOKIE_POLICY_CONTENT = `
# Cookie Policy for Recall

Effective Date: March 26, 2026

## 1. What are Cookies?
Cookies are small text files stored on your device to enhance your experience.

## 2. How We Use Cookies
- **Essential Cookies**: Necessary for authentication and session management.
- **Functional Cookies**: Used to remember your preferences (e.g., theme, LLM settings).
- **Analytics Cookies**: Help us understand how you use Recall to improve the service.

## 3. Managing Cookies
You can manage or disable cookies through your browser settings, though some features of Recall may not function correctly without them.
`;

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      {/* Page Header */}
      <div className="mb-12 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
          Cookie Policy
        </h1>
        <p className="text-sm text-neutral-500">Last updated: March 26, 2026</p>
        <div className="h-px bg-white/10" />
      </div>

      {/* Policy Content */}
      <article className="prose prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:hidden prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-xl prose-h2:text-white prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-base prose-h3:text-white prose-p:text-neutral-400 prose-p:leading-relaxed prose-li:text-neutral-400 prose-strong:text-white prose-a:text-white prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-neutral-300 prose-ul:my-3 prose-li:my-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {COOKIE_POLICY_CONTENT}
        </ReactMarkdown>
      </article>
    </div>
  );
}
