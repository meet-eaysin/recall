'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from '@/features/auth/hooks';
import { legalApi } from '../api';

export function useConsentStatus(props?: { anonymousId?: string | null }) {
  const { data, status } = useAuthSession();
  const isAuthLoading = status === 'loading';

  const query = useQuery({
    queryKey: ['consent-status', data?.user?.id, props?.anonymousId],
    queryFn: () => 
      legalApi.getConsentStatus({ 
        userId: data?.user?.id, 
        anonymousId: props?.anonymousId || undefined 
      }),
    enabled: !isAuthLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return { ...query, status };
}
