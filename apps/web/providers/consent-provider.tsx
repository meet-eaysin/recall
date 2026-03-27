'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useConsentStatus } from '@/features/legal/hooks/use-consent-status';
import { useAnonymousId } from '@/features/legal/hooks/use-anonymous-id';
import { ConsentModal } from '@/features/legal/components/consent-modal';
import { CookieBanner } from '@/features/legal/components/cookie-banner';
import type { ConsentStatus } from '@repo/types';

interface ConsentContextType {
  consent: ConsentStatus | undefined;
  isLoading: boolean;
  isConsentRequired: boolean;
  isAuthenticated: boolean;
  status: 'authenticated' | 'unauthenticated' | 'loading';
  openModal: () => void;
  refetch: () => Promise<unknown>;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

const LEGAL_PAGES = [
  '/privacy-policy',
  '/cookie-policy',
  '/terms-of-service',
  '/terms',
];

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const anonymousId = useAnonymousId();
  const {
    data: consent,
    status,
    isLoading: isConsentLoading,
    refetch,
  } = useConsentStatus({ anonymousId });
  const [showModal, setShowModal] = useState(false);

  const isAuthenticated = status === 'authenticated';
  const isLegalPage = LEGAL_PAGES.includes(pathname);
  const isAppRoute = pathname.startsWith('/app');

  const isConsentRequired =
    !isConsentLoading &&
    !!consent &&
    (!consent.privacyAccepted ||
      !consent.cookieAccepted ||
      !consent.termsAccepted);

  useEffect(() => {
    if (!isAppRoute || isLegalPage) setShowModal(false);
  }, [pathname, isAppRoute, isLegalPage]);

  useEffect(() => {
    if (isAuthenticated && isConsentRequired && isAppRoute) {
      setShowModal(true);
    }
  }, [isAuthenticated, isConsentRequired, isAppRoute]);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <ConsentContext.Provider
      value={{
        consent,
        isLoading: isConsentLoading,
        isConsentRequired: !!isConsentRequired,
        isAuthenticated,
        status,
        openModal,
        refetch,
      }}
    >
      {children}

      {!showModal && !isAuthenticated && <CookieBanner />}

      {showModal && consent && (
        <ConsentModal
          isOpen={showModal}
          onSuccess={() => {
            closeModal();
            void refetch();
          }}
          onClose={!isAuthenticated ? closeModal : undefined}
          requiredVersions={consent.requiredVersions}
        />
      )}
    </ConsentContext.Provider>
  );
}

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
};
