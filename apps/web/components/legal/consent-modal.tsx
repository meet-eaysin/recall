'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchPrivacyPolicy, fetchCookiePolicy, acceptPolicies } from '@/lib/legal-api';
import type { LegalDocument } from '@repo/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  requiredVersion: string;
}

export function ConsentModal({ isOpen, onSuccess, requiredVersion }: ConsentModalProps) {
  const [privacyPolicy, setPrivacyPolicy] = useState<LegalDocument | null>(null);
  const [cookiePolicy, setCookiePolicy] = useState<LegalDocument | null>(null);
  const [hasScrolledPrivacy, setHasScrolledPrivacy] = useState(false);
  const [hasScrolledCookie, setHasScrolledCookie] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [cookieAccepted, setCookieAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('privacy');

  const privacyScrollRef = useRef<HTMLDivElement>(null);
  const cookieScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      void fetchPrivacyPolicy().then(setPrivacyPolicy);
      void fetchCookiePolicy().then(setCookiePolicy);
    }
  }, [isOpen]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>, policy: 'privacy' | 'cookie') => {
      const target = e.currentTarget;
      const isAtBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight < 40;
      if (isAtBottom) {
        if (policy === 'privacy') setHasScrolledPrivacy(true);
        if (policy === 'cookie') setHasScrolledCookie(true);
      }
    },
    [],
  );

  const handlePrivacyToggle = useCallback(
    (checked: boolean | 'indeterminate') => {
      setPrivacyAccepted(checked === true);
    },
    [],
  );

  const handleCookieToggle = useCallback(
    (checked: boolean | 'indeterminate') => {
      setCookieAccepted(checked === true);
    },
    [],
  );

  const handleAcceptAll = async () => {
    if (!privacyAccepted || !cookieAccepted) return;
    setIsSubmitting(true);
    try {
      await acceptPolicies(['privacy', 'cookie'], requiredVersion);
      toast.success('Policies accepted successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to accept policies. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = privacyAccepted && cookieAccepted && !isSubmitting;

  return (
    <Dialog open={isOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg max-h-[80vh] flex flex-col gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="px-4 pt-4 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Legal Consent Required
          </DialogTitle>
          <DialogDescription>
            Please review and accept our policies to continue using Recall.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="border-t px-4">
            <TabsList variant="line" className="w-full justify-start gap-0">
              <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
              <TabsTrigger value="cookie">Cookie Policy</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="privacy"
            className="flex-1 flex flex-col overflow-hidden m-0"
          >
            <div
              ref={privacyScrollRef}
              onScroll={(e) => handleScroll(e, 'privacy')}
              className="flex-1 overflow-y-auto px-4 py-3"
            >
              {privacyPolicy ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-h1:text-base prose-h2:text-sm prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {privacyPolicy.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="border-t px-4 py-3">
              <label
                htmlFor="accept-privacy"
                className="flex items-start gap-3 cursor-pointer select-none"
              >
                <Checkbox
                  id="accept-privacy"
                  checked={privacyAccepted}
                  onCheckedChange={handlePrivacyToggle}
                  disabled={!hasScrolledPrivacy}
                  className="mt-0.5"
                />
                <span className="text-sm leading-snug">
                  {hasScrolledPrivacy ? (
                    <span className="text-foreground font-medium">
                      I have read and accept the Privacy Policy
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Scroll to the bottom to accept the Privacy Policy
                    </span>
                  )}
                </span>
              </label>
            </div>
          </TabsContent>

          <TabsContent
            value="cookie"
            className="flex-1 flex flex-col overflow-hidden m-0"
          >
            <div
              ref={cookieScrollRef}
              onScroll={(e) => handleScroll(e, 'cookie')}
              className="flex-1 overflow-y-auto px-4 py-3"
            >
              {cookiePolicy ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-h1:text-base prose-h2:text-sm prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {cookiePolicy.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="border-t px-4 py-3">
              <label
                htmlFor="accept-cookie"
                className="flex items-start gap-3 cursor-pointer select-none"
              >
                <Checkbox
                  id="accept-cookie"
                  checked={cookieAccepted}
                  onCheckedChange={handleCookieToggle}
                  disabled={!hasScrolledCookie}
                  className="mt-0.5"
                />
                <span className="text-sm leading-snug">
                  {hasScrolledCookie ? (
                    <span className="text-foreground font-medium">
                      I have read and accept the Cookie Policy
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Scroll to the bottom to accept the Cookie Policy
                    </span>
                  )}
                </span>
              </label>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            onClick={handleAcceptAll}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Accepting…
              </>
            ) : (
              'Accept & Continue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
