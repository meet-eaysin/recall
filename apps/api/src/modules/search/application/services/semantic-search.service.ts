import { Injectable } from '@nestjs/common';
import { QdrantWrapper, ResolvedLLMConfig, embeddingAdapter } from '@repo/ai';
import { env } from '../../../../shared/utils/env';
import { isObject } from '../../../../shared/utils/type-guards.util';
import { IDocumentRepository } from '../../../documents/domain/repositories/document.repository';
import {
  SearchQueryDto,
  SemanticSearchResultDto,
} from '../../interface/schemas/search.schema';

interface QdrantPayload {
  documentId: string;
  userId: string;
  [key: string]: unknown;
}

function isQdrantPayload(payload: unknown): payload is QdrantPayload {
  if (!isObject(payload)) return false;
  return 'documentId' in payload && 'userId' in payload;
}

@Injectable()
export class SemanticSearchService {
  private readonly qdrant = new QdrantWrapper(
    env.QDRANT_URL,
    env.QDRANT_API_KEY,
  );

  constructor(private readonly documentRepository: IDocumentRepository) {}

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
    await this.qdrant.ensurePayloadIndexes('mindstack');

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
      if (!isQdrantPayload(payload)) {
        continue;
      }

      const docId = payload.documentId;
      const score = result.score ?? 0;
      const existingScore = bestScores.get(docId) ?? 0;
      if (score > existingScore) {
        bestScores.set(docId, score);
      }
    }

    const documentIds = Array.from(bestScores.keys());
    if (documentIds.length === 0) {
      return [];
    }

    const docs = await Promise.all(
      documentIds.map((id) =>
        this.documentRepository.findById(id, internalUserId),
      ),
    );

    const results: SemanticSearchResultDto[] = [];
    for (const doc of docs) {
      if (!doc) {
        continue;
      }

      const publicView = doc.toPublicView();
      if (query.status && publicView.status !== query.status) {
        continue;
      }
      if (query.type && publicView.type !== query.type) {
        continue;
      }
      if (query.folderIds?.length) {
        if (
          !publicView.folderId ||
          !query.folderIds.includes(publicView.folderId)
        ) {
          continue;
        }
      }
      if (query.tagIds?.length) {
        const hasTag = query.tagIds.some((tagId) =>
          publicView.tags.includes(tagId),
        );
        if (!hasTag) {
          continue;
        }
      }

      results.push({
        documentId: publicView.id,
        title: publicView.title,
        type: publicView.type,
        status: publicView.status,
        score: bestScores.get(publicView.id) ?? 0,
        preview:
          publicView.type === 'text'
            ? (doc.props.content?.substring(0, 200) ?? '')
            : publicView.title,
        tags: publicView.tags,
        createdAt: publicView.createdAt,
      });
    }

    return results.sort((left, right) => right.score - left.score);
  }
}
