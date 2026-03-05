import { Injectable, NotFoundException } from '@nestjs/common';
import { LLMConfigModel } from '@repo/db';
import { LLMConfigPublicView } from '@repo/types';
import { LLMConfigEntity } from '../../domain/entities/llm-config.entity';

@Injectable()
export class GetLLMConfigUseCase {
  async execute(userId: string): Promise<LLMConfigPublicView> {
    const config = await LLMConfigModel.findOne({ userId });

    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    const entity = new LLMConfigEntity({
      id: config._id.toString(),
      userId: config.userId.toString(),
      provider: config.provider,
      chatModel: config.chatModel,
      embeddingModel: config.embeddingModel,
      apiKey: null, // apiKey is not loaded here as it's not needed for PublicView
      baseUrl: config.baseUrl || null,
      capabilities: config.capabilities,
      validatedAt: config.validatedAt,
    });

    return entity.toPublicView();
  }
}
