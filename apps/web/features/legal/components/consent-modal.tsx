'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { legalApi } from '../api';
import { useAnonymousId } from '../hooks/use-anonymous-id';
import type { LegalDocument, CookieCategory, LegalDocumentType } from '@repo/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { ShieldCheck, Loader2, Check, Settings2 } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  requiredVersions: Record<LegalDocumentType, string>;
}

export function ConsentModal({ isOpen, onSuccess, onClose, requiredVersions }: ConsentModalProps) {
  const [policies, setPolicies] = useState<Record<LegalDocumentType, LegalDocument | null>>({
    privacy: null,
    cookie: null,
    terms: null,
  });
  
  const [hasScrolled, setHasScrolled] = useState<Record<LegalDocumentType, boolean>>({
    privacy: false,
    cookie: false,
    terms: false,
  });

  const [acceptedPolicies, setAcceptedPolicies] = useState<Record<LegalDocumentType, boolean>>({
    privacy: false,
    cookie: false,
    terms: false,
  });

  const [categories, setCategories] = useState<CookieCategory[]>(['necessary']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('privacy');
  
  const anonymousId = useAnonymousId();

  useEffect(() => {
    if (isOpen) {
      void Promise.all([
        legalApi.getPolicy('privacy'),
        legalApi.getPolicy('cookie'),
        legalApi.getTermsOfService(),
      ]).then(([privacy, cookie, terms]) => {
        setPolicies({ privacy, cookie, terms });
      }).catch((err: Error) => {
        console.error('Failed to pre-fetch policies:', err);
      });
    }
  }, [isOpen]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>, type: LegalDocumentType) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 40;
    if (isAtBottom) {
      setHasScrolled(prev => ({ ...prev, [type]: true }));
    }
  }, []);

  const handleTogglePolicy = (type: LegalDocumentType, checked: boolean) => {
    setAcceptedPolicies(prev => ({ ...prev, [type]: checked }));
  };

  const handleToggleCategory = (category: CookieCategory, checked: boolean) => {
    if (category === 'necessary') return;
    setCategories(prev => 
      checked ? [...prev, category] : prev.filter(c => c !== category)
    );
  };

  const submitConsent = async (targetCategories: CookieCategory[]) => {
    if (!acceptedPolicies.privacy || !acceptedPolicies.cookie || !acceptedPolicies.terms) {
      toast.error('Please accept all mandatory policies to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await legalApi.acceptConsent({
        policyVersions: requiredVersions,
        categories: targetCategories,
      }, { anonymousId: anonymousId || undefined });
      
      toast.success('Preferences saved successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to save preferences. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptAll = () => {
    if (!hasScrolled.privacy || !hasScrolled.cookie || !hasScrolled.terms) {
      toast.info('Please scroll through all policies first.');
      return;
    }
    setAcceptedPolicies({ privacy: true, cookie: true, terms: true });
    setCategories(['necessary', 'analytics', 'marketing']);
    void submitConsent(['necessary', 'analytics', 'marketing']);
  };

  const handleSavePreferences = () => {
    void submitConsent(categories);
  };

  const canSubmit = acceptedPolicies.privacy && acceptedPolicies.cookie && acceptedPolicies.terms && !isSubmitting;

  const renderPolicyContent = (type: LegalDocumentType) => {
    const policy = policies[type];
    if (!policy) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-neutral-500" />
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col overflow-hidden m-0">
        <div 
          onScroll={(e) => handleScroll(e, type)}
          className="flex-1 overflow-y-auto px-4 py-3"
        >
          <div className="prose prose-sm prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-neutral-400 prose-li:text-neutral-400 prose-strong:text-white">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {policy.content}
            </ReactMarkdown>
          </div>
        </div>
        <div className="border-t border-neutral-800 px-4 py-3 bg-neutral-900/50">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <Checkbox
              checked={acceptedPolicies[type]}
              onCheckedChange={(checked) => handleTogglePolicy(type, checked === true)}
              disabled={!hasScrolled[type]}
              className="mt-0.5"
            />
            <span className="text-sm leading-snug">
              {hasScrolled[type] ? (
                <span className="text-white font-medium italic">
                  I have read and accept the {policy.title}
                </span>
              ) : (
                <span className="text-neutral-400">
                  Scroll to the bottom to accept the {policy.type} policy
                </span>
              )}
            </span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent showCloseButton={!!onClose} className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden bg-neutral-950 border-neutral-800 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-800">
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <ShieldCheck className="size-6 text-primary" />
            Legal Consent & Preferences
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            We value your privacy. Please review our policies and customize your cookie settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 bg-neutral-900/30">
            <TabsList className="w-full justify-start gap-2 h-12 bg-transparent border-none">
              <TabsTrigger value="privacy" className="data-[state=active]:text-primary data-[state=active]:bg-transparent">Privacy</TabsTrigger>
              <TabsTrigger value="cookie" className="data-[state=active]:text-primary data-[state=active]:bg-transparent">Cookies</TabsTrigger>
              <TabsTrigger value="terms" className="data-[state=active]:text-primary data-[state=active]:bg-transparent">Terms</TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:text-primary data-[state=active]:bg-transparent flex items-center gap-1.5">
                <Settings2 className="size-3.5" />
                Customize
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="privacy" className="flex-1 flex flex-col overflow-hidden m-0 outline-none">
            {renderPolicyContent('privacy')}
          </TabsContent>

          <TabsContent value="cookie" className="flex-1 flex flex-col overflow-hidden m-0 outline-none">
            {renderPolicyContent('cookie')}
          </TabsContent>

          <TabsContent value="terms" className="flex-1 flex flex-col overflow-hidden m-0 outline-none">
            {renderPolicyContent('terms')}
          </TabsContent>

          <TabsContent value="preferences" className="flex-1 flex flex-col overflow-hidden m-0 p-6 outline-none">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Necessary Cookies</p>
                    <p className="text-xs text-neutral-500">Essential for the website to function. Always active.</p>
                  </div>
                  <Switch checked disabled />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Analytics Cookies</p>
                    <p className="text-xs text-neutral-500">Help us improve by understanding how you use our service.</p>
                  </div>
                  <Switch 
                    checked={categories.includes('analytics')} 
                    onCheckedChange={(checked) => handleToggleCategory('analytics', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Marketing Cookies</p>
                    <p className="text-xs text-neutral-500">Used to provide personalized announcements and features.</p>
                  </div>
                  <Switch 
                    checked={categories.includes('marketing')} 
                    onCheckedChange={(checked) => handleToggleCategory('marketing', checked)}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-primary leading-relaxed">
                  Note: Mandatory policies (Privacy, Cookie, Terms) must be accepted regardless of optional cookie categories.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={handleSavePreferences}
            disabled={!canSubmit || isSubmitting}
            className="w-full sm:w-auto text-neutral-400 hover:text-white"
          >
            Save Preferences
          </Button>
          <Button
            onClick={handleAcceptAll}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Accept All & Continue
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
