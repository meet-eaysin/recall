import { Injectable } from '@nestjs/common';
import { LLMConfigModel } from '@repo/db';
import { LLMConfigEntity } from '../../domain/entities/llm-config.entity';
import { ILLMConfigRepository } from '../../domain/repositories/llm-config.repository';

@Injectable()
export class MongooseLLMConfigRepository extends ILLMConfigRepository {
  async findByUserId(userId: string): Promise<LLMConfigEntity | null> {
    const config = await LLMConfigModel.findOne({ userId });
    if (!config) return null;

    return new LLMConfigEntity({
      id: config._id.toString(),
      userId: config.userId.toString(),
      provider: config.provider,
      chatModel: config.chatModel,
      embeddingModel: config.embeddingModel,
      apiKey: config.apiKey ?? null,
      baseUrl: config.baseUrl || null,
      capabilities: config.capabilities,
      validatedAt: config.validatedAt,
    });
  }

  async save(entity: LLMConfigEntity): Promise<void> {
    await LLMConfigModel.findOneAndUpdate(
      { userId: entity.userId },
      {
        provider: entity.props.provider,
        chatModel: entity.props.chatModel,
        embeddingModel: entity.props.embeddingModel,
        apiKey: entity.props.apiKey,
        baseUrl: entity.props.baseUrl,
        capabilities: entity.props.capabilities,
        validatedAt: entity.props.validatedAt,
      },
      { upsert: true, new: true },
    );
  }
}
