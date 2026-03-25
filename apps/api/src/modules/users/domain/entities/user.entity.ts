import type { UserPublicView } from '@repo/types';

export interface UserEntityProps {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  authId: string;
  privacyPolicyAcceptedAt?: Date | null;
  cookiePolicyAcceptedAt?: Date | null;
  consentVersion?: string | null;
  consentIp?: string | null;
  consentUserAgent?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserEntity {
  constructor(public readonly props: UserEntityProps) {}

  get id(): string {
    return this.props.id;
  }

  get authId(): string {
    return this.props.authId;
  }

  get privacyPolicyAcceptedAt(): Date | null | undefined {
    return this.props.privacyPolicyAcceptedAt;
  }

  get cookiePolicyAcceptedAt(): Date | null | undefined {
    return this.props.cookiePolicyAcceptedAt;
  }

  get consentVersion(): string | null | undefined {
    return this.props.consentVersion;
  }

  get consentIp(): string | null | undefined {
    return this.props.consentIp;
  }

  get consentUserAgent(): string | null | undefined {
    return this.props.consentUserAgent;
  }

  toPublicView(): UserPublicView {
    return {
      id: this.props.id,
      email: this.props.email,
      name: this.props.name,
      avatarUrl: this.props.avatarUrl ?? null,
    };
  }
}
