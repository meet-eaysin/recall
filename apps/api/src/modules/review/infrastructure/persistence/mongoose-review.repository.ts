import { Injectable } from '@nestjs/common';
import { ReviewDismissalModel, NoteModel } from '@repo/db';
import { Types } from 'mongoose';
import { IReviewRepository } from '../../domain/repositories/review.repository';

@Injectable()
export class MongooseReviewRepository extends IReviewRepository {
  async findDismissedTargetIds(
    userId: string,
    date: string,
    targetType: string,
  ): Promise<string[]> {
    const dismissed = await ReviewDismissalModel.find({
      userId: new Types.ObjectId(userId),
      date,
      targetType,
    }).select('targetId');
    return dismissed.map((d) => d.targetId.toString());
  }

  async dismiss(
    userId: string,
    targetId: string,
    targetType: string,
    date: string,
  ): Promise<void> {
    await ReviewDismissalModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        targetId: new Types.ObjectId(targetId),
        date,
      },
      {
        userId: new Types.ObjectId(userId),
        targetId: new Types.ObjectId(targetId),
        targetType,
        date,
      },
      { upsert: true },
    );
  }

  async findDocumentIdsWithNotes(userId: string): Promise<string[]> {
    const noteDocIds = await NoteModel.distinct('documentId', {
      userId: new Types.ObjectId(userId),
    });
    return noteDocIds.map((id) => id.toString());
  }
}
