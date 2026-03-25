'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COOKIE_NAME = 'recall-cookie-consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const hasConsent = document.cookie
      .split('; ')
      .some((row) => row.startsWith(`${COOKIE_NAME}=`));

    if (!hasConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    const maxAge = 31536000; // 1 year
    document.cookie = `${COOKIE_NAME}=accepted; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
    setIsVisible(false);
    setTimeout(() => setHide(true), 700);
  };

  const handleDecline = () => {
    setIsVisible(false);
    setTimeout(() => setHide(true), 700);
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 p-4 duration-700',
        !isVisible
          ? 'transition-[opacity,transform] translate-y-8 opacity-0'
          : 'transition-[opacity,transform] translate-y-0 opacity-100',
        hide && 'hidden',
      )}
    >
      <div className="mx-auto max-w-4xl items-center rounded-xl border border-border bg-background px-5 py-4 shadow-lg md:flex">
        <div className="mb-4 md:mb-0 md:flex-1 md:pr-6">
          <p className="text-center text-xs text-muted-foreground md:pr-12 md:text-left">
            Recall uses cookies for authentication, session management, and to
            remember your preferences such as theme and LLM settings. By
            clicking Accept, you consent to our use of cookies. Read our{' '}
            <Link
              href="/cookie-policy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy-policy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy Policy
            </Link>{' '}
            for more details.
          </p>
        </div>
        <div className="space-x-2 text-center">
          <Button size="sm" variant="outline" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Accept cookies
          </Button>
        </div>
      </div>
    </div>
  );
}
