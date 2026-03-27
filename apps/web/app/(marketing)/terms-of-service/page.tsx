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
    <div className="px-3 pt-32 pb-12 sm:px-8 animate-in fade-in duration-700">
      <div className="mx-auto max-w-7xl px-4">
        {/* Page Header */}
        <div className="mb-12 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
              {policy.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-neutral-500 font-medium">
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
        </div>

        {/* Policy Content */}
        <article className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:hidden prose-h2:mt-16 prose-h2:mb-6 prose-h2:text-2xl prose-h2:text-white prose-h2:pb-4 prose-h2:border-b prose-h2:border-white/5 prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-lg prose-h3:text-white prose-p:text-neutral-400 prose-p:leading-relaxed prose-li:text-neutral-400 prose-strong:text-white prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80 transition-colors prose-ul:my-6 prose-li:my-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {policy.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
