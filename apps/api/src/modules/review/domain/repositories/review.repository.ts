export abstract class IReviewRepository {
  abstract findDismissedTargetIds(
    userId: string,
    date: string,
    targetType: string,
  ): Promise<string[]>;
  abstract dismiss(
    userId: string,
    targetId: string,
    targetType: string,
    date: string,
  ): Promise<void>;
  abstract findDocumentIdsWithNotes(userId: string): Promise<string[]>;
}
