'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { legalApi } from '@/features/legal/api';
import { PolicySkeleton } from '@/features/legal/components/policy-skeleton';
import type { LegalDocument } from '@repo/types';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function TermsOfServicePage() {
  const [policy, setPolicy] = useState<LegalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    legalApi
      .getTermsOfService()
      .then(setPolicy)
      .catch((err: Error) => {
        console.error('Failed to fetch terms of service:', err);
        setError('Failed to load terms of service. Please try again later.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <PolicySkeleton />;
  }

  if (error || !policy) {
    return (
      <div className="container mx-auto max-w-7xl py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Policy not found.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-16 md:py-24">
      {/* Page Header */}
      <div className="mb-12 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
          {policy.title}
        </h1>
        <p className="text-sm text-neutral-500">
          Last updated: {new Date(policy.effectiveDate).toLocaleDateString()}{' '}
          (Version {policy.version})
        </p>
        <div className="h-px bg-white/10" />
      </div>

      {/* Policy Content */}
      <article className="prose prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:hidden prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-xl prose-h2:text-white prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-base prose-h3:text-white prose-p:text-neutral-400 prose-p:leading-relaxed prose-li:text-neutral-400 prose-strong:text-white prose-a:text-white prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-neutral-300 prose-ul:my-3 prose-li:my-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {policy.content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
