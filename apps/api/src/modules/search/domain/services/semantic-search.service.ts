import { Injectable } from '@nestjs/common';
import { IDocumentRepository } from '../../../documents/domain/repositories/document.repository';
import {
  SearchQueryDto,
  SemanticSearchResultDto,
} from '../../interface/schemas/search.schema';
import { QdrantWrapper, embeddingAdapter, ResolvedLLMConfig } from '@repo/ai';
import { env } from '../../../../shared/utils/env';

interface QdrantPayload {
  documentId: string;
  userId: string;
  [key: string]: unknown;
}

import { isObject } from '../../../../shared/utils/type-guards.util';

function isQdrantPayload(payload: unknown): payload is QdrantPayload {
  if (!isObject(payload)) return false;
  return 'documentId' in payload && 'userId' in payload;
}

@Injectable()
export class SemanticSearchService {
  private qdrant: QdrantWrapper;

  constructor(private readonly documentRepository: IDocumentRepository) {
    this.qdrant = new QdrantWrapper(env.QDRANT_URL, env.QDRANT_API_KEY);
  }

  private transformUserId(userId: string): string {
    if (/^[0-9a-fA-F]{24}$/.test(userId)) {
      return userId;
    }
    const hex = Buffer.from(userId).toString('hex');
    return hex.padEnd(24, '0').slice(0, 24);
  }

  async search(
    userId: string,
    query: SearchQueryDto,
    llmConfig: ResolvedLLMConfig,
  ): Promise<SemanticSearchResultDto[]> {
    const internalUserId = this.transformUserId(userId);
    const queryVector = await embeddingAdapter.embedText(query.q, llmConfig);

    const qdrantResults = await this.qdrant.searchSimilar(
      'mindstack',
      queryVector,
      {
        must: [{ key: 'userId', match: { value: internalUserId } }],
      },
      10,
    );

    const bestScores = new Map<string, number>();
    for (const result of qdrantResults) {
      const payload = result.payload;
      if (isQdrantPayload(payload)) {
        const docId = payload.documentId;
        const score = result.score ?? 0;
        const existingScore = bestScores.get(docId) ?? 0;
        if (score > existingScore) {
          bestScores.set(docId, score);
        }
      }
    }

    const documentIds = Array.from(bestScores.keys());
    if (documentIds.length === 0) {
      return [];
    }

    const docsPromises = documentIds.map((id) =>
      this.documentRepository.findById(id, internalUserId),
    );
    const docs = await Promise.all(docsPromises);

    const semanticResults: SemanticSearchResultDto[] = [];

    for (const doc of docs) {
      if (!doc) continue;

      const publicView = doc.toPublicView();

      if (query.status && publicView.status !== query.status) continue;
      if (query.type && publicView.type !== query.type) continue;
      if (query.folderIds && query.folderIds.length > 0) {
        if (
          !publicView.folderId ||
          !query.folderIds.includes(publicView.folderId)
        )
          continue;
      }
      if (query.tagIds && query.tagIds.length > 0) {
        const hasTag = query.tagIds.some((t) => publicView.tags.includes(t));
        if (!hasTag) continue;
      }

      let preview = '';
      if (publicView.type === 'text') {
        const content = doc.props.content;
        preview = content ? content.substring(0, 200) : '';
      } else {
        preview = publicView.title;
      }

      const score = bestScores.get(publicView.id) ?? 0;

      semanticResults.push({
        documentId: publicView.id,
        title: publicView.title,
        type: publicView.type,
        status: publicView.status,
        score,
        preview,
        tags: publicView.tags,
        createdAt: publicView.createdAt,
      });
    }

    semanticResults.sort((a, b) => b.score - a.score);

    return semanticResults;
  }
}
