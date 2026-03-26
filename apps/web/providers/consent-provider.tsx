'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useConsentStatus } from '@/features/legal/hooks/use-consent-status';
import { useAnonymousId } from '@/features/legal/hooks/use-anonymous-id';
import { ConsentModal } from '@/features/legal/components/consent-modal';
import { CookieBanner } from '@/features/legal/components/cookie-banner';

interface ConsentContextType {
  isConsentRequired: boolean;
  openModal: () => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const anonymousId = useAnonymousId();
  const {
    data: consent,
    status,
    isLoading: isConsentLoading,
    refetch,
  } = useConsentStatus({ anonymousId });
  const [showModal, setShowModal] = useState(false);

  // Consent is required if any mandatory policy is not accepted
  const isConsentRequired =
    !isConsentLoading &&
    !!consent &&
    (!consent.privacyAccepted ||
      !consent.cookieAccepted ||
      !consent.termsAccepted);

  // Auto-show modal ONLY for authenticated users who need to accept terms
  useEffect(() => {
    if (status === 'authenticated' && isConsentRequired) {
      setShowModal(true);
    }
  }, [status, isConsentRequired]);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <ConsentContext.Provider
      value={{
        isConsentRequired: !!isConsentRequired,
        openModal,
      }}
    >
      {children}
      {!showModal && <CookieBanner />}
      {showModal && consent && (
        <ConsentModal
          isOpen={showModal}
          onSuccess={() => {
            closeModal();
            void refetch();
          }}
          onClose={status !== 'authenticated' ? closeModal : undefined}
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
