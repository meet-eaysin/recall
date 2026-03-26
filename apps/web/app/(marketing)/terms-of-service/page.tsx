'use client';

import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { legalApi } from '@/features/legal/api';
import { PolicySkeleton } from '@/features/legal/components/policy-skeleton';
import { PolicyError } from '@/features/legal/components/policy-error';
import type { LegalDocument } from '@repo/types';

export default function TermsOfServicePage() {
  const [policy, setPolicy] = useState<LegalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await legalApi.getTermsOfService();
      setPolicy(data);
    } catch (err) {
      console.error('Failed to fetch terms of service:', err);
      setError('Failed to load terms of service. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPolicy();
  }, [fetchPolicy]);

  if (isLoading) {
    return <PolicySkeleton />;
  }

  if (error || !policy) {
    return (
      <PolicyError error={error || 'Policy not found.'} onRetry={fetchPolicy} />
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-16 md:py-24 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="mb-16 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-white">
            {policy.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-neutral-500 font-medium bg-neutral-900/40 w-fit px-4 py-2 rounded-full border border-neutral-800">
            <span>Version {policy.version}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-700" />
            <span>
              Effective:{' '}
              {new Date(policy.effectiveDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <div className="h-px bg-white/10 w-full" />
      </div>

      {/* Policy Content */}
      <article className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:hidden prose-h2:mt-16 prose-h2:mb-6 prose-h2:text-2xl prose-h2:text-white prose-h2:pb-4 prose-h2:border-b prose-h2:border-white/5 prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-lg prose-h3:text-white prose-p:text-neutral-400 prose-p:leading-relaxed prose-li:text-neutral-400 prose-strong:text-white prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80 transition-colors prose-ul:my-6 prose-li:my-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {policy.content}
        </ReactMarkdown>
      </article>

      <div className="mt-24 pt-12 border-t border-white/10 text-center">
        <p className="text-sm text-neutral-500">
          Have questions about our terms?{' '}
          <a
            href="mailto:support@recall.ai"
            className="text-white hover:underline underline-offset-4 font-medium transition-colors"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
