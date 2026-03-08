import { AuthProvider } from '@repo/types';

export interface ExternalIdentityEntityProps {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
  email?: string;
  emailVerified: boolean;
  profileSnapshot?: Record<string, unknown>;
  linkedAt: Date;
  lastLoginAt?: Date;
}

export class ExternalIdentityEntity {
  constructor(public readonly props: ExternalIdentityEntityProps) {}

  get userId(): string {
    return this.props.userId;
  }
}
