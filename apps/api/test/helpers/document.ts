import {
  DocumentType,
  DocumentStatus,
  IngestionStatus,
  SourceType,
} from '@repo/types';
import { TEST_USER_ID, generateId, isObject } from './common';

export interface DocumentResponse {
  success: boolean;
  data: {
    document: {
      id: string;
      userId: string;
      title: string;
      type: DocumentType;
      status: DocumentStatus;
      sourceType: SourceType;
      sourceUrl?: string;
      tags: string[];
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface ListDocumentsResponse {
  success: boolean;
  data: {
    items: DocumentResponse['data']['document'][];
    total: number;
    page: number;
    limit: number;
  };
}

export function isDocumentResponse(body: unknown): body is DocumentResponse {
  if (!isObject(body)) return false;
  if (body.success !== true) return false;
  if (!isObject(body.data)) return false;

  const data = body.data;
  if (!isObject(data.document)) return false;

  const doc = data.document;
  return (
    typeof doc.id === 'string' &&
    typeof doc.userId === 'string' &&
    typeof doc.title === 'string'
  );
}

export function isListDocumentsResponse(
  body: unknown,
): body is ListDocumentsResponse {
  if (!isObject(body)) return false;
  if (body.success !== true) return false;
  if (!isObject(body.data)) return false;

  const data = body.data;
  return Array.isArray(data.items) && typeof data.total === 'number';
}

export async function seedDocument(
  overrides: {
    userId?: string;
    title?: string;
    type?: DocumentType;
    status?: DocumentStatus;
    sourceUrl?: string;
    sourceType?: SourceType;
    embeddingsReady?: boolean;
    ingestionStatus?: IngestionStatus;
    ingestionError?: string | null;
  } = {},
): Promise<string> {
  const { DocumentModel } = await import('@repo/db');
  const doc = new DocumentModel({
    userId: overrides.userId ?? TEST_USER_ID,
    title: overrides.title ?? 'Test Document',
    type: overrides.type ?? DocumentType.PDF,
    status: overrides.status ?? DocumentStatus.TO_READ,
    sourceUrl:
      overrides.sourceUrl ?? `https://example.com/test-${generateId()}.pdf`,
    sourceType: overrides.sourceType ?? SourceType.URL,
    embeddingsReady: overrides.embeddingsReady ?? false,
    ingestionStatus: overrides.ingestionStatus ?? IngestionStatus.PENDING,
    ingestionError: overrides.ingestionError ?? null,
    metadata: {},
    folderIds: [],
    tagIds: [],
  });
  const saved = await doc.save();
  return saved._id.toString();
}
