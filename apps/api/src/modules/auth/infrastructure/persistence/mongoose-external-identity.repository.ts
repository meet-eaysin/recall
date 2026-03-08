import { Injectable } from '@nestjs/common';
import { ExternalIdentityModel, IExternalIdentityDocument } from '@repo/db';
import { AuthProvider } from '@repo/types';
import { Types } from 'mongoose';
import {
  IExternalIdentityRepository,
  LinkExternalIdentityInput,
} from '../../domain/repositories/external-identity.repository';
import { ExternalIdentityEntity } from '../../domain/entities/external-identity.entity';

@Injectable()
export class MongooseExternalIdentityRepository implements IExternalIdentityRepository {
  async findByProviderIdentity(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<ExternalIdentityEntity | null> {
    const doc = await ExternalIdentityModel.findOne({
      provider,
      providerUserId,
    }).exec();

    return doc ? this.toEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<ExternalIdentityEntity[]> {
    const docs = await ExternalIdentityModel.find({
      userId: new Types.ObjectId(userId),
    }).exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async link(
    input: LinkExternalIdentityInput,
  ): Promise<ExternalIdentityEntity> {
    const doc = await ExternalIdentityModel.findOneAndUpdate(
      {
        provider: input.provider,
        providerUserId: input.providerUserId,
      },
      {
        $set: {
          userId: new Types.ObjectId(input.userId),
          email: input.email,
          emailVerified: input.emailVerified,
          profileSnapshot: input.profileSnapshot,
          lastLoginAt: new Date(),
        },
        $setOnInsert: {
          linkedAt: new Date(),
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

  private toEntity(doc: IExternalIdentityDocument): ExternalIdentityEntity {
    return new ExternalIdentityEntity({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      provider: doc.provider,
      providerUserId: doc.providerUserId,
      email: doc.email,
      emailVerified: doc.emailVerified,
      profileSnapshot: doc.profileSnapshot,
      linkedAt: doc.linkedAt,
      lastLoginAt: doc.lastLoginAt,
    });
  }
}
