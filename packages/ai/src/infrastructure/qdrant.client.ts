import { QdrantClient } from '@qdrant/js-client-rest';

type QdrantFilter = NonNullable<
  Parameters<QdrantClient['search']>[1]['filter']
>;

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: {
    documentId: string;
    userId: string;
    chunkIndex: number;
    [key: string]: unknown;
  };
}

export class QdrantWrapper {
  private client: QdrantClient;

  constructor(url: string, apiKey?: string) {
    this.client = new QdrantClient({
      url,
      checkCompatibility: false,
      ...(apiKey ? { apiKey } : {}),
    });
  }

  async ensureCollection(name: string, vectorSize: number): Promise<void> {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some((c) => c.name === name);

    if (!exists) {
      await this.client.createCollection(name, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      });
    }

    await this.ensurePayloadIndexes(name);
  }

  async ensurePayloadIndexes(collection: string): Promise<void> {
    const existingSchema =
      (await this.client.getCollection(collection)).payload_schema ?? {};

    const requiredIndexes = [
      { field_name: 'userId', field_schema: 'keyword' as const },
      { field_name: 'documentId', field_schema: 'keyword' as const },
    ];

    for (const index of requiredIndexes) {
      if (existingSchema[index.field_name]) {
        continue;
      }

      await this.client.createPayloadIndex(collection, {
        field_name: index.field_name,
        field_schema: index.field_schema,
        wait: true,
      });
    }
  }

  async upsertPoints(collection: string, points: QdrantPoint[]): Promise<void> {
    // Batch upsert in chunks of 100
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await this.client.upsert(collection, {
        wait: true,
        points: batch.map((p) => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload,
        })),
      });
    }
  }

  async searchSimilar(
    collection: string,
    vector: number[],
    filter?: QdrantFilter,
    topK = 5,
  ) {
    const searchParams: Parameters<QdrantClient['search']>[1] = {
      vector,
      limit: topK,
      with_payload: true,
    };

    if (filter) {
      searchParams.filter = filter;
    }

    return this.client.search(collection, searchParams);
  }

  async deleteByFilter(
    collection: string,
    filter: QdrantFilter,
  ): Promise<void> {
    await this.client.delete(collection, {
      filter,
      wait: true,
    });
  }
}
