export type AuthProvider = 'google' | 'github';

export type IdentityProvider = AuthProvider | 'dev';

export interface AuthenticatedUser {
  userId: string;
  sessionId?: string;
  authId?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  provider?: IdentityProvider;
}

export type AuthTokenType = 'access' | 'refresh';

export interface AuthTokenClaims {
  sub: string;
  sid: string;
  typ: AuthTokenType;
  authId?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  provider?: IdentityProvider;
}

export interface AuthSessionUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  provider: IdentityProvider | null;
}

export interface AuthSessionView {
  authenticated: true;
  user: AuthSessionUser;
  session: {
    id: string | null;
  };
}
