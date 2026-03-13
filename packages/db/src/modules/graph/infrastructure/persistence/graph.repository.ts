import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { GraphNodeModel } from './graph-node.model';
import { GraphEdgeModel } from './graph-edge.model';
import { IGraphNodeDocument } from '../types/graph-node.type';
import { IGraphEdgeDocument } from '../types/graph-edge.type';
import { GraphNodeType } from '@repo/types';
import {
  IGraphRepository,
  UpsertEdgeData,
} from '../../domain/repository.interface';
import { GraphNodeEntity } from '../../domain/entities/node.entity';
import { GraphEdgeEntity } from '../../domain/entities/edge.entity';

@Injectable()
export class MongooseGraphRepository extends IGraphRepository {
  private mapNode(doc: IGraphNodeDocument): GraphNodeEntity {
    return GraphNodeEntity.create({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      type: doc.type,
      documentId: doc.documentId?.toString(),
      label: doc.label,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      properties: doc.properties,
    });
  }

  private mapEdge(doc: IGraphEdgeDocument): GraphEdgeEntity {
    return GraphEdgeEntity.create({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      fromNodeId: doc.fromNodeId.toString(),
      toNodeId: doc.toNodeId.toString(),
      relationType: doc.relationType,
      weight: doc.weight,
      generationMethod: doc.generationMethod,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      properties: doc.properties,
    });
  }

  async findRootNode(userId: string): Promise<GraphNodeEntity | null> {
    const doc = await GraphNodeModel.findOne({
      userId: new Types.ObjectId(userId),
      type: GraphNodeType.ROOT,
    })
      .lean<IGraphNodeDocument>()
      .exec();

    return doc ? this.mapNode(doc) : null;
  }

  async createRootNode(
    userId: string,
    label: string,
  ): Promise<GraphNodeEntity> {
    const doc = await GraphNodeModel.create({
      userId: new Types.ObjectId(userId),
      type: GraphNodeType.ROOT,
      label,
      properties: {},
    });

    return this.mapNode(doc.toObject());
  }

  async upsertDocumentNode(
    userId: string,
    documentId: string,
    label: string,
  ): Promise<GraphNodeEntity> {
    const doc = await GraphNodeModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        documentId: new Types.ObjectId(documentId),
      },
      { label, type: GraphNodeType.DOCUMENT },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
      .lean<IGraphNodeDocument>()
      .exec();

    if (!doc) throw new Error('Failed to upsert document node');
    return this.mapNode(doc);
  }

  async findNodeByDocumentId(
    userId: string,
    documentId: string,
  ): Promise<GraphNodeEntity | null> {
    const doc = await GraphNodeModel.findOne({
      userId: new Types.ObjectId(userId),
      documentId: new Types.ObjectId(documentId),
    })
      .lean<IGraphNodeDocument>()
      .exec();

    return doc ? this.mapNode(doc) : null;
  }

  async upsertEdge(data: UpsertEdgeData): Promise<GraphEdgeEntity> {
    const doc = await GraphEdgeModel.findOneAndUpdate(
      {
        fromNodeId: new Types.ObjectId(data.fromNodeId),
        toNodeId: new Types.ObjectId(data.toNodeId),
        relationType: data.relationType,
      },
      {
        userId: new Types.ObjectId(data.userId),
        weight: data.weight,
        generationMethod: data.generationMethod,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
      .lean<IGraphEdgeDocument>()
      .exec();

    if (!doc) throw new Error('Failed to upsert edge');
    return this.mapEdge(doc);
  }

  async findAllNodes(userId: string): Promise<GraphNodeEntity[]> {
    const docs =
      (await GraphNodeModel.find({
        userId: new Types.ObjectId(userId),
      })
        .lean<IGraphNodeDocument[]>()
        .exec()) || [];

    return docs.map((doc) => this.mapNode(doc));
  }

  async findAllEdges(userId: string): Promise<GraphEdgeEntity[]> {
    const docs =
      (await GraphEdgeModel.find({
        userId: new Types.ObjectId(userId),
      })
        .lean<IGraphEdgeDocument[]>()
        .exec()) || [];

    return docs.map((doc) => this.mapEdge(doc));
  }

  async findDirectEdges(
    nodeId: string,
    userId: string,
  ): Promise<GraphEdgeEntity[]> {
    const docs =
      (await GraphEdgeModel.find({
        userId: new Types.ObjectId(userId),
        $or: [
          { fromNodeId: new Types.ObjectId(nodeId) },
          { toNodeId: new Types.ObjectId(nodeId) },
        ],
      })
        .lean<IGraphEdgeDocument[]>()
        .exec()) || [];

    return docs.map((doc) => this.mapEdge(doc));
  }

  async findNodesByIds(nodeIds: string[]): Promise<GraphNodeEntity[]> {
    if (nodeIds.length === 0) return [];

    const docs =
      (await GraphNodeModel.find({
        _id: { $in: nodeIds.map((id) => new Types.ObjectId(id)) },
      })
        .lean<IGraphNodeDocument[]>()
        .exec()) || [];

    return docs.map((doc) => this.mapNode(doc));
  }

  async deleteNodeForDocument(
    documentId: string,
    userId: string,
  ): Promise<void> {
    await GraphNodeModel.deleteOne({
      userId: new Types.ObjectId(userId),
      documentId: new Types.ObjectId(documentId),
    }).exec();
  }

  async deleteEdgesForDocument(
    documentId: string,
    userId: string,
  ): Promise<void> {
    const node = await GraphNodeModel.findOne({
      userId: new Types.ObjectId(userId),
      documentId: new Types.ObjectId(documentId),
    })
      .lean<IGraphNodeDocument>()
      .exec();

    if (node) {
      await GraphEdgeModel.deleteMany({
        userId: new Types.ObjectId(userId),
        $or: [{ fromNodeId: node._id }, { toNodeId: node._id }],
      }).exec();
    }
  }

  async hasPathToRoot(nodeId: string, userId: string): Promise<boolean> {
    const rootNode = await this.findRootNode(userId);
    if (!rootNode) return false;
    if (rootNode.id === nodeId) return true;

    const visited = new Set<string>();
    const queue: string[] = [nodeId];
    visited.add(nodeId);

    const userIdObj = new Types.ObjectId(userId);

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;

      const currentIdObj = new Types.ObjectId(currentId);
      const edges = await GraphEdgeModel.find({
        userId: userIdObj,
        $or: [{ fromNodeId: currentIdObj }, { toNodeId: currentIdObj }],
      })
        .lean<IGraphEdgeDocument[]>()
        .exec();

      for (const edge of edges) {
        const nextId =
          edge.fromNodeId.toString() === currentId
            ? edge.toNodeId.toString()
            : edge.fromNodeId.toString();

        if (nextId === rootNode.id) {
          return true;
        }

        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push(nextId);
        }
      }
    }

    return false;
  }
}
