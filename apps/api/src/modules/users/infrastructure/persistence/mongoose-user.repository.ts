import { Injectable } from '@nestjs/common';
import { UserModel } from '@repo/db';
import { IUserDocument } from '@repo/db';
import {
  IUserRepository,
  UpsertIdentityUserInput,
  UpsertUserByIdInput,
} from '../../domain/repositories/user.repository';
import { UserEntity } from '../../domain/entities/user.entity';

@Injectable()
export class MongooseUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const doc = await UserModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByAuthId(authId: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ authId }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ email }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(input: UpsertIdentityUserInput): Promise<UserEntity> {
    const doc = await UserModel.create({
      authId: input.authId,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl,
    });

    return this.toEntity(doc);
  }

  async upsertFromIdentity(
    input: UpsertIdentityUserInput,
  ): Promise<UserEntity> {
    const doc = await UserModel.findOneAndUpdate(
      { authId: input.authId },
      {
        $set: {
          email: input.email,
          name: input.name,
          avatarUrl: input.avatarUrl,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).exec();

    return this.toEntity(doc);
  }

  async upsertById(input: UpsertUserByIdInput): Promise<UserEntity> {
    const doc = await UserModel.findOneAndUpdate(
      { _id: input.id },
      {
        $setOnInsert: {
          authId: input.authId,
          email: input.email,
          name: input.name,
          avatarUrl: input.avatarUrl,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).exec();

    return this.toEntity(doc);
  }

  async update(
    id: string,
    input: Partial<Omit<UpsertIdentityUserInput, 'authId'>>,
  ): Promise<UserEntity> {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true },
    ).exec();

    if (!doc) throw new Error('User not found');
    return this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await UserModel.deleteOne({ _id: id }).exec();
  }

  private toEntity(doc: IUserDocument): UserEntity {
    return new UserEntity({
      id: doc.id,
      email: doc.email,
      name: doc.name,
      avatarUrl: doc.avatarUrl,
      authId: doc.authId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
