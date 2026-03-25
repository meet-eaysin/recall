'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useConsentStatus } from '@/hooks/use-consent-status';
import { useAuthSession } from '@/features/auth/hooks';
import { ConsentModal } from '@/components/legal/consent-modal';

interface ConsentContextType {
  isConsentRequired: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const { status: authStatus } = useAuthSession();
  const { data: consent, isLoading: isConsentLoading, refetch } = useConsentStatus();
  const [showModal, setShowModal] = useState(false);

  const isAuthenticated = authStatus === 'authenticated';
  const isConsentRequired = isAuthenticated && !isConsentLoading && consent && (!consent.privacyAccepted || !consent.cookieAccepted);

  useEffect(() => {
    if (isConsentRequired) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isConsentRequired]);

  return (
    <ConsentContext.Provider value={{ isConsentRequired: !!isConsentRequired }}>
      {children}
      {showModal && consent && (
        <ConsentModal 
          isOpen={showModal} 
          onSuccess={() => {
            setShowModal(false);
            void refetch();
          }}
          requiredVersion={consent.requiredVersion}
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
