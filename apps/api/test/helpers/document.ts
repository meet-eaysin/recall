import { DocumentType, DocumentStatus, SourceType } from '@repo/types';
import { TEST_USER_ID, generateId } from './common';

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
  items: DocumentResponse['data']['document'][];
  total: number;
  page: number;
  limit: number;
}

export function isDocumentResponse(body: unknown): body is DocumentResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null) return false;

  const data = body.data;
  if (!('document' in data) || typeof data.document !== 'object' || data.document === null) return false;

  const doc = data.document;
  return (
    'id' in doc && typeof doc.id === 'string' &&
    'userId' in doc && typeof doc.userId === 'string' &&
    'title' in doc && typeof doc.title === 'string'
  );
}

export function isListDocumentsResponse(body: unknown): body is ListDocumentsResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('items' in body) || !Array.isArray(body.items)) return false;
  if (!('total' in body) || typeof body.total !== 'number') return false;
  return true;
}

export async function seedDocument(overrides: {
  userId?: string;
  title?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  sourceUrl?: string;
  sourceType?: SourceType;
  embeddingsReady?: boolean;
} = {}): Promise<string> {
  const { DocumentModel } = await import('@repo/db');
  const doc = new DocumentModel({
    userId: overrides.userId ?? TEST_USER_ID,
    title: overrides.title ?? 'Test Document',
    type: overrides.type ?? DocumentType.PDF,
    status: overrides.status ?? DocumentStatus.TO_READ,
    sourceUrl: overrides.sourceUrl ?? `https://example.com/test-${generateId()}.pdf`,
    sourceType: overrides.sourceType ?? SourceType.URL,
    embeddingsReady: overrides.embeddingsReady ?? false,
    metadata: {},
    folderIds: [],
    tagIds: [],
  });
  const saved = await doc.save();
  return saved._id.toString();
}
