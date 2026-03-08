import type { AuthProvider } from '@repo/types';
import type { ExternalIdentityEntity } from '../entities/external-identity.entity';

export interface LinkExternalIdentityInput {
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
  email?: string;
  emailVerified: boolean;
  profileSnapshot?: Record<string, unknown>;
}

export abstract class IExternalIdentityRepository {
  abstract findByProviderIdentity(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<ExternalIdentityEntity | null>;

  abstract findByUserId(userId: string): Promise<ExternalIdentityEntity[]>;

  abstract link(
    input: LinkExternalIdentityInput,
  ): Promise<ExternalIdentityEntity>;
}
