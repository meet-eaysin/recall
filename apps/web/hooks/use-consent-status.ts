import { useQuery } from '@tanstack/react-query';
import { fetchConsentStatus } from '@/lib/legal-api';
import { useAuthSession } from '@/features/auth/hooks';

export function useConsentStatus() {
  const { status } = useAuthSession();

  return useQuery({
    queryKey: ['consent-status'],
    queryFn: fetchConsentStatus,
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
