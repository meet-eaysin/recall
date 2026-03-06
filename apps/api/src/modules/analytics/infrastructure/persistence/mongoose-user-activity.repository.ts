import { Injectable } from '@nestjs/common';
import { UserActivityModel, DocumentModel, NoteModel } from '@repo/db';
import { Types } from 'mongoose';
import {
  AnalyticsDocumentStatsAggregationResult,
  AnalyticsStatsAggregationResult,
} from '@repo/types';
import { IUserActivityRepository } from '../../domain/repositories/user-activity.repository';

@Injectable()
export class MongooseUserActivityRepository extends IUserActivityRepository {
  async getStats(userId: string): Promise<{
    totalDocuments: number;
    docsByType: AnalyticsDocumentStatsAggregationResult[];
    docsByStatus: AnalyticsDocumentStatsAggregationResult[];
    totalNotes: number;
    activityHistory: { _id: string; count: number }[];
    mostActiveDay: string | null;
  }> {
    const [
      totalDocuments,
      docsByType,
      docsByStatus,
      totalNotes,
      activityHistory,
    ] = await Promise.all([
      DocumentModel.countDocuments({ userId: userId }),
      DocumentModel.aggregate<AnalyticsDocumentStatsAggregationResult>([
        { $match: { userId: userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      DocumentModel.aggregate<AnalyticsDocumentStatsAggregationResult>([
        { $match: { userId: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      NoteModel.countDocuments({ userId: userId }),
      UserActivityModel.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
    ]);

    const mostActiveDay =
      activityHistory.length > 0
        ? [...activityHistory].sort((a, b) => b.count - a.count)[0]._id
        : null;

    return {
      totalDocuments,
      docsByType,
      docsByStatus,
      totalNotes,
      activityHistory,
      mostActiveDay,
    };
  }

  async getHeatmap(
    userId: string,
    startDate: Date,
  ): Promise<AnalyticsStatsAggregationResult[]> {
    const result =
      await UserActivityModel.aggregate<AnalyticsStatsAggregationResult>([
        {
          $match: {
            userId: userId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            doc_added: {
              $sum: { $cond: [{ $eq: ['$action', 'doc_added'] }, 1, 0] },
            },
            doc_opened: {
              $sum: { $cond: [{ $eq: ['$action', 'doc_opened'] }, 1, 0] },
            },
            note_created: {
              $sum: { $cond: [{ $eq: ['$action', 'note_created'] }, 1, 0] },
            },
            summary_generated: {
              $sum: {
                $cond: [{ $eq: ['$action', 'summary_generated'] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]).exec();
    return result;
  }

  async recordActivity(data: {
    userId: string;
    targetId: string;
    targetType: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await UserActivityModel.create({
      userId: data.userId,
      targetId: new Types.ObjectId(data.targetId),
      targetType: data.targetType,
      action: data.action,
      metadata: data.metadata,
    });
  }
}
