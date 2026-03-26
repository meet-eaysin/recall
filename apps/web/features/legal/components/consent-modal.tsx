'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { legalApi } from '../api';
import { useAnonymousId } from '../hooks/use-anonymous-id';
import type { CookieCategory, LegalDocumentType } from '@repo/types';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConsentModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  requiredVersions: Record<LegalDocumentType, string>;
}

const POLICIES: { type: LegalDocumentType; label: string; path: string }[] = [
  { type: 'privacy', label: 'Privacy Policy', path: '/privacy-policy' },
  { type: 'cookie', label: 'Cookie Policy', path: '/cookie-policy' },
  { type: 'terms', label: 'Terms of Service', path: '/terms-of-service' },
];

const COOKIE_OPTIONS: {
  key: CookieCategory;
  label: string;
  description: string;
  required?: boolean;
}[] = [
  {
    key: 'necessary',
    label: 'Necessary',
    description: 'Core functionality & security',
    required: true,
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'Usage insights & improvements',
  },
  {
    key: 'marketing',
    label: 'Marketing',
    description: 'Personalized announcements',
  },
];

export function ConsentModal({
  isOpen,
  onSuccess,
  onClose,
  requiredVersions,
}: ConsentModalProps) {
  const [categories, setCategories] = useState<CookieCategory[]>(['necessary']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const anonymousId = useAnonymousId();

  const toggleCategory = (key: CookieCategory, checked: boolean) => {
    if (key === 'necessary') return;
    setCategories((prev) =>
      checked ? [...prev, key] : prev.filter((c) => c !== key),
    );
  };

  const submit = async (cats: CookieCategory[]) => {
    setIsSubmitting(true);
    try {
      await legalApi.acceptConsent(
        { policyVersions: requiredVersions, categories: cats },
        { anonymousId: anonymousId || undefined },
      );
      toast.success('Preferences saved.');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptAll = () => {
    const all: CookieCategory[] = ['necessary', 'analytics', 'marketing'];
    setCategories(all);
    void submit(all);
  };

  const handleSave = () => void submit(categories);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent
        showCloseButton={!!onClose}
        className="sm:max-w-lg p-0 gap-0 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-2xl overflow-hidden"
      >
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="size-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
              <ShieldCheck className="size-4 text-neutral-600 dark:text-neutral-400" />
            </div>
            <DialogTitle className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
              Before you continue
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            We&apos;ve updated our policies. Please review and accept to keep
            using the service.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* ── Policies list ── */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {POLICIES.map((p) => (
              <Link
                key={p.type}
                href={p.path}
                target="_blank"
                className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-900/80 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors truncate">
                    {p.label}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-600 shrink-0">
                    v{requiredVersions[p.type]}
                  </span>
                </div>
                <ArrowRight className="size-3.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>

          <Separator className="bg-neutral-100 dark:bg-neutral-800" />

          {/* ── Cookie toggles ── */}
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-3">
              Cookie preferences
            </p>
            {COOKIE_OPTIONS.map((opt, i) => (
              <div
                key={opt.key}
                className={cn(
                  'flex items-center justify-between py-2.5 px-1',
                  i !== COOKIE_OPTIONS.length - 1 &&
                    'border-b border-neutral-100 dark:border-neutral-800/60',
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                      {opt.label}
                    </p>
                    {opt.required && (
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-600 font-mono">
                        required
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    {opt.description}
                  </p>
                </div>
                <Switch
                  checked={opt.required || categories.includes(opt.key)}
                  onCheckedChange={(checked) =>
                    toggleCategory(opt.key, checked)
                  }
                  disabled={!!opt.required}
                  className="shrink-0 scale-90"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          {/* Legal note */}
          <p className="text-[11px] text-neutral-400 dark:text-neutral-600 text-center leading-relaxed mb-1">
            By continuing, you agree to our{' '}
            <Link
              href="/privacy-policy"
              target="_blank"
              className="underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
            >
              Privacy Policy
            </Link>
            ,{' '}
            <Link
              href="/cookie-policy"
              target="_blank"
              className="underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
            >
              Cookie Policy
            </Link>{' '}
            &{' '}
            <Link
              href="/terms-of-service"
              target="_blank"
              className="underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
            >
              Terms of Service
            </Link>
            .
          </p>

          <Button
            onClick={handleAcceptAll}
            disabled={isSubmitting}
            className="w-full h-10 text-[13px] font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-white rounded-xl transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Accept all & continue'
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full h-9 text-[12px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-xl transition-colors"
          >
            Save my preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
