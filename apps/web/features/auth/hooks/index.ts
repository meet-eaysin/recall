import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthSessionView } from '@repo/types';
import { authApi, type DevLoginInput } from '../api';
import { QUERY_KEYS } from '@/lib/query-keys';
import { clearDevUserId, isDevAuthEnabled, setDevUserId } from '@/lib/dev-auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

function getAuthStatus(
  session: AuthSessionView | undefined,
  isLoading: boolean,
  isError: boolean,
): AuthStatus {
  if (isLoading) return 'loading';
  if (session?.authenticated) return 'authenticated';
  if (isError) return 'unauthenticated';
  return 'unauthenticated';
}

export function useAuthSession() {
  const query = useQuery({
    queryKey: QUERY_KEYS.AUTH.SESSION,
    queryFn: authApi.getSession,
    retry: false,
  });

  return {
    ...query,
    status: getAuthStatus(query.data, query.isLoading, query.isError),
  };
}

export function useDevLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DevLoginInput) => authApi.devLogin(input),
    onSuccess: (session) => {
      if (isDevAuthEnabled() && session?.user?.id) {
        setDevUserId(session.user.id);
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.SESSION });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.USERS.sessions(),
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearDevUserId();
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.SESSION });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.USERS.sessions(),
      });
    },
  });
}
