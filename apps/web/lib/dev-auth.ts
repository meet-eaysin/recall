import { env } from '@/lib/env';

const DEV_AUTH_FLAG = env.isDevAuthEnabled;
const DEV_USER_ID_KEY = 'dev-user-id';

export function isDevAuthEnabled(): boolean {
  return DEV_AUTH_FLAG;
}

export function getDevUserId(): string {
  if (!DEV_AUTH_FLAG) return '';
  if (typeof window === 'undefined') {
    return env.NEXT_PUBLIC_DEV_USER_ID ?? '';
  }

  const stored = window.localStorage.getItem(DEV_USER_ID_KEY);
  return stored && stored.length > 0
    ? stored
    : (env.NEXT_PUBLIC_DEV_USER_ID ?? '');
}

export function setDevUserId(userId: string): void {
  if (!DEV_AUTH_FLAG || typeof window === 'undefined') return;
  if (!userId) return;
  window.localStorage.setItem(DEV_USER_ID_KEY, userId);
}

export function clearDevUserId(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DEV_USER_ID_KEY);
}
