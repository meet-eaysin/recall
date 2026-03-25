'use client';

import React, { useEffect, useState } from 'react';
import { fetchCookiePolicy } from '@/lib/legal-api';
import type { LegalDocument } from '@repo/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CookiePolicyPage() {
  const [policy, setPolicy] = useState<LegalDocument | null>(null);

  useEffect(() => {
    void fetchCookiePolicy().then(setPolicy);
  }, []);

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <header className="border-b h-16 flex items-center px-6 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>
      </header>
      <main className="flex-1 flex justify-center p-6 md:p-12">
        <div className="max-w-3xl w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-bold">Cookie Policy</h1>
            {policy && (
              <p className="text-muted-foreground">
                Last updated: {new Date(policy.effectiveDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {policy ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{policy.content}</ReactMarkdown>
            ) : (
              <p>Loading Cookie Policy...</p>
            )}
          </div>
        </div>
      </main>
      <footer className="border-t p-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Recall. All rights reserved.
      </footer>
    </div>
  );
}
