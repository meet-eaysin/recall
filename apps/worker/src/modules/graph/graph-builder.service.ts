import { Injectable, Logger } from '@nestjs/common';
import { IGraphRepository, IDocumentRepository, isObject } from '@repo/db';
import { QdrantWrapper, embeddingAdapter, LLMClientFactory } from '@repo/ai';
import { env } from '../../shared/utils/env';
import { GraphGenerationMethod, GraphRelationType } from '@repo/types';

interface QdrantPayload {
  documentId: string;
  userId: string;
  [key: string]: unknown;
}

function isQdrantPayload(payload: unknown): payload is QdrantPayload {
  if (!isObject(payload)) return false;
  return (
    'documentId' in (payload as object) &&
    'userId' in (payload as object) &&
    typeof payload.documentId === 'string'
  );
}

@Injectable()
export class GraphBuilderService {
  private qdrant: QdrantWrapper;
  private readonly logger = new Logger(GraphBuilderService.name);

  constructor(
    private readonly graphRepository: IGraphRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly llmClientFactory: LLMClientFactory,
  ) {
    this.qdrant = new QdrantWrapper(env.QDRANT_URL, env.QDRANT_API_KEY);
  }

  private transformUserId(userId: string): string {
    if (/^[0-9a-fA-F]{24}$/.test(userId)) {
      return userId;
    }
    const hex = Buffer.from(userId).toString('hex');
    return hex.padEnd(24, '0').slice(0, 24);
  }

  async buildRelationships(documentId: string, userId: string): Promise<void> {
    const internalUserId = this.transformUserId(userId);

    try {
      // 1. Ensure root node exists
      let rootNode = await this.graphRepository.findRootNode(internalUserId);
      if (!rootNode) {
        rootNode = await this.graphRepository.createRootNode(
          internalUserId,
          'User Brain',
        );
      }

      // 2. Fetch document
      const doc = await this.documentRepository.findById(
        documentId,
        internalUserId,
      );
      if (!doc) {
        this.logger.warn(
          `[GraphBuilder] Document ${documentId} not found in repository for user ${internalUserId}.`,
        );
        return;
      }

      // 3. Upsert document node
      const docNode = await this.graphRepository.upsertDocumentNode(
        internalUserId,
        documentId,
        doc.title,
      );

      // 4. If embeddings are ready, build similarity edges
      if (doc.embeddingsReady) {
        const config = await this.llmClientFactory.resolveConfigForUserId(internalUserId);

        try {
          const queryVector = await embeddingAdapter.embedText(
            doc.title,
            config,
          );

          await this.qdrant.ensurePayloadIndexes('mindstack');

          const results = await this.qdrant.searchSimilar(
            'mindstack',
            queryVector,
            {
              must: [
                { key: 'userId', match: { value: internalUserId } },
                {
                  key: 'documentId',
                  match: { except: [documentId] },
                },
              ],
            },
            10,
          );

          for (const result of results) {
            const payload = result.payload;
            if (
              isQdrantPayload(payload) &&
              result.score !== undefined &&
              result.score > 0.65
            ) {
              const targetDocId = payload.documentId;
              const targetNode =
                await this.graphRepository.findNodeByDocumentId(
                  internalUserId,
                  targetDocId,
                );
              if (targetNode) {
                this.logger.log(
                  `[GraphBuilder] Creating similarity edge to document: ${targetDocId} (Score: ${result.score})`,
                );
                await this.graphRepository.upsertEdge({
                  userId: internalUserId,
                  fromNodeId: docNode.id,
                  toNodeId: targetNode.id,
                  relationType: GraphRelationType.SEMANTIC_SIMILARITY,
                  weight: result.score,
                  generationMethod: GraphGenerationMethod.SEMANTIC_SIMILARITY,
                });
              }
            }
          }
        } catch (embedError) {
          this.logger.error(
            '[GraphBuilder] Similarity search failed:',
            embedError,
          );
        }

        // 5. Topical and Tag-based connections
        const { docs: otherDocs } = await this.documentRepository.findAll(
          internalUserId,
          { page: 1, limit: 100 },
        );

        for (const otherDoc of otherDocs) {
          if (otherDoc.id === documentId) continue;

          const sharedTags = doc
            .toPublicView()
            .tags.filter((t) => otherDoc.toPublicView().tags.includes(t));

          if (sharedTags.length >= 2) {
            const targetNode = await this.graphRepository.findNodeByDocumentId(
              internalUserId,
              otherDoc.id,
            );
            if (targetNode) {
              const totalTags = new Set([
                ...doc.toPublicView().tags,
                ...otherDoc.toPublicView().tags,
              ]).size;
              await this.graphRepository.upsertEdge({
                userId: internalUserId,
                fromNodeId: docNode.id,
                toNodeId: targetNode.id,
                relationType: GraphRelationType.TOPICAL,
                weight: sharedTags.length / (totalTags || 1),
                generationMethod: GraphGenerationMethod.TOPICAL,
              });
            }
          } else if (sharedTags.length >= 1) {
            const targetNode = await this.graphRepository.findNodeByDocumentId(
              internalUserId,
              otherDoc.id,
            );
            if (targetNode) {
              await this.graphRepository.upsertEdge({
                userId: internalUserId,
                fromNodeId: docNode.id,
                toNodeId: targetNode.id,
                relationType: GraphRelationType.SHARED_TAGS,
                weight: 0.5,
                generationMethod: GraphGenerationMethod.SHARED_TAGS,
              });
            }
          }
        }
      }

      // 6. Connectivity Check: Ensure this node or its component is anchored to the root
      const isAnchored = await this.graphRepository.hasPathToRoot(
        docNode.id,
        internalUserId,
      );

      if (!isAnchored) {
        this.logger.log(
          `[GraphBuilder] Anchor required for ${documentId}. Connecting to User Brain.`,
        );
        await this.graphRepository.upsertEdge({
          userId: internalUserId,
          fromNodeId: docNode.id,
          toNodeId: rootNode.id,
          relationType: GraphRelationType.ROOT_CONNECTION,
          weight: 0.1,
          generationMethod: GraphGenerationMethod.ROOT_CONNECTION,
        });
      } else {
        this.logger.log(
          `[GraphBuilder] Node ${documentId} is already anchored to root via relationships.`,
        );
      }

      this.logger.log(
        `[GraphBuilder] Finished building relationships for ${documentId}`,
      );
    } catch (error) {
      this.logger.error(
        `[GraphBuilder] Error processing ${documentId}:`,
        error,
      );
    }
  }
}
