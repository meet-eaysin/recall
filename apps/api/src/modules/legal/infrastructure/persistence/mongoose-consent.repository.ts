import { Injectable } from '@nestjs/common';
import { ConsentRecordModel } from '@repo/db';
import type { IConsentRecordDocument } from '@repo/db';
import { IConsentRepository } from '../../domain/repositories/consent.repository';

@Injectable()
export class MongooseConsentRepository extends IConsentRepository {
  async create(
    data: Partial<IConsentRecordDocument>,
  ): Promise<IConsentRecordDocument> {
    return ConsentRecordModel.create(data);
  }

  async findLatestByUserId(
    userId: string,
  ): Promise<IConsentRecordDocument | null> {
    return ConsentRecordModel.findOne({ userId })
      .sort({ timestamp: -1 })
      .exec();
  }

  async findLatestByAnonymousId(
    anonymousId: string,
  ): Promise<IConsentRecordDocument | null> {
    return ConsentRecordModel.findOne({ anonymousId })
      .sort({ timestamp: -1 })
      .exec();
  }
}
