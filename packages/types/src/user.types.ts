export interface UserPublicView {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface UserSessionView {
  sessionId: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  current: boolean;
}
