'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useConsentStatus } from '../hooks/use-consent-status';
import { legalApi } from '../api';
import { useAnonymousId } from '../hooks/use-anonymous-id';
import { Cookie, Settings2 } from 'lucide-react';
import { useConsent } from '@/providers/consent-provider';

export function CookieBanner() {
  const anonymousId = useAnonymousId();
  const {
    data: consent,
    isLoading,
    refetch,
  } = useConsentStatus({ anonymousId });
  const { openModal } = useConsent();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isLoading && consent && !consent.cookieAccepted) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [consent, isLoading]);

  const handleAcceptAll = async () => {
    if (!consent) return;
    try {
      await legalApi.acceptConsent(
        {
          policyVersions: consent.requiredVersions,
          categories: ['necessary', 'analytics', 'marketing'],
        },
        { anonymousId: anonymousId || undefined },
      );

      setIsVisible(false);
      void refetch();
    } catch (error) {
      console.error('Failed to accept cookies:', error);
    }
  };

  const handleDeclineOptional = async () => {
    if (!consent) return;
    try {
      await legalApi.acceptConsent(
        {
          policyVersions: consent.requiredVersions,
          categories: ['necessary'],
        },
        { anonymousId: anonymousId || undefined },
      );

      setIsVisible(false);
      void refetch();
    } catch (error) {
      console.error('Failed to decline optional cookies:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 w-full max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex flex-col md:flex-row items-center gap-4 p-5 rounded-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur-md shadow-2xl">
        <div className="hidden md:flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary shrink-0">
          <Cookie className="size-5" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <p className="text-sm font-medium text-white mb-1">
            We value your privacy
          </p>
          <p className="text-xs text-neutral-400 leading-relaxed italic">
            We use cookies to enhance your experience and analyze site traffic.
            By clicking &quot;Accept All&quot;, you agree to our use of all
            cookies. Review our{' '}
            <Link
              href="/cookie-policy"
              className="text-primary hover:underline underline-offset-4"
            >
              Cookie Policy
            </Link>
            .
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={openModal}
            className="flex-1 md:flex-none text-neutral-500 hover:text-white gap-1.5"
          >
            <Settings2 className="size-3.5" />
            Customize
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeclineOptional}
            className="flex-1 md:flex-none text-neutral-400 hover:text-white"
          >
            Necessary Only
          </Button>
          <Button
            size="sm"
            onClick={handleAcceptAll}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
