import { Injectable } from '@nestjs/common';
import { ConsentRecordModel } from '@repo/db';
import {
  CreateConsentRecordData,
  IConsentRepository,
} from '../../domain/repositories/consent.repository';
import { ConsentRecordEntity } from '../../domain/entities/consent-record.entity';
import type { IConsentRecordDocument } from '@repo/db';
import type { CookieCategory } from '@repo/types';

@Injectable()
export class MongooseConsentRepository extends IConsentRepository {
  async create(data: CreateConsentRecordData): Promise<ConsentRecordEntity> {
    const record = await ConsentRecordModel.create(data);
    return this.toEntity(record.toObject<IConsentRecordDocument>());
  }

  async findLatestByUserId(
    userId: string,
  ): Promise<ConsentRecordEntity | null> {
    const record = await ConsentRecordModel.findOne({ userId })
      .sort({ timestamp: -1 })
      .exec();

    return record
      ? this.toEntity(record.toObject<IConsentRecordDocument>())
      : null;
  }

  async findLatestByAnonymousId(
    anonymousId: string,
  ): Promise<ConsentRecordEntity | null> {
    const record = await ConsentRecordModel.findOne({ anonymousId })
      .sort({ timestamp: -1 })
      .exec();

    return record
      ? this.toEntity(record.toObject<IConsentRecordDocument>())
      : null;
  }

  private toEntity(record: IConsentRecordDocument): ConsentRecordEntity {
    const policyVersions =
      record.policyVersions instanceof Map
        ? Object.fromEntries(record.policyVersions.entries())
        : record.policyVersions;
    const timestamps = record as IConsentRecordDocument & {
      createdAt?: Date;
      updatedAt?: Date;
    };

    return new ConsentRecordEntity({
      id: record._id.toString(),
      userId: record.userId,
      anonymousId: record.anonymousId,
      policyVersions,
      categories: record.categories as CookieCategory[],
      ip: record.ip,
      userAgent: record.userAgent,
      timestamp: record.timestamp,
      createdAt: timestamps.createdAt ?? record.timestamp,
      updatedAt: timestamps.updatedAt ?? record.timestamp,
    });
  }
}
