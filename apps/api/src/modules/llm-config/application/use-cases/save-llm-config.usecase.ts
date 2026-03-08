import { Injectable } from '@nestjs/common';
import type { LLMConfigPublicView, SaveLLMConfigRequest } from '@repo/types';
import { LLMConfigEntity } from '../../domain/entities/llm-config.entity';
import { encrypt } from '@repo/crypto';
import { env } from '../../../../shared/utils/env';
import { LLMValidatorService } from '../../domain/services/llm-validator.service';
import { ILLMConfigRepository } from '../../domain/repositories/llm-config.repository';

@Injectable()
export class SaveLLMConfigUseCase {
  constructor(
    private readonly validatorService: LLMValidatorService,
    private readonly llmConfigRepository: ILLMConfigRepository,
  ) {}

  async execute(
    userId: string,
    data: SaveLLMConfigRequest,
  ): Promise<LLMConfigPublicView> {
    // 1. Validate
    const capabilities = await this.validatorService.validate(
      data.provider,
      data.apiKey || null,
      data.baseUrl || null,
      data.chatModel,
      data.embeddingModel,
    );

    // 2. Encrypt API key
    let encryptedApiKey: string | null = null;
    if (data.apiKey) {
      encryptedApiKey = encrypt(data.apiKey, env.ENCRYPTION_KEY);
    }

    // 3. Create Entity
    const entity = new LLMConfigEntity({
      userId,
      provider: data.provider,
      chatModel: data.chatModel,
      embeddingModel: data.embeddingModel,
      apiKey: encryptedApiKey,
      baseUrl: data.baseUrl || null,
      capabilities,
      validatedAt: new Date(),
    });

    // 4. Save via repository
    await this.llmConfigRepository.save(entity);

    return entity.toPublicView();
  }
}
