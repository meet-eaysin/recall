import type { UserPublicView } from '@repo/types';

export interface UserEntityProps {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  authId: string;
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

  toPublicView(): UserPublicView {
    return {
      id: this.props.id,
      email: this.props.email,
      name: this.props.name,
      avatarUrl: this.props.avatarUrl ?? null,
    };
  }
}
