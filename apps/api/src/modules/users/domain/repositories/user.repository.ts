import type { UserEntity } from '../entities/user.entity';

export interface UpsertIdentityUserInput {
  authId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export abstract class IUserRepository {
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract findByAuthId(authId: string): Promise<UserEntity | null>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract create(input: UpsertIdentityUserInput): Promise<UserEntity>;
  abstract upsertFromIdentity(
    input: UpsertIdentityUserInput,
  ): Promise<UserEntity>;
}
