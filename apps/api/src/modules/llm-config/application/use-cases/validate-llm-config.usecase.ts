import { Injectable, Logger } from '@nestjs/common';
import { LLMConfigModel } from '@repo/db';
import type { LLMCapabilities, ValidateLLMConfigRequest } from '@repo/types';
import { decrypt } from '@repo/crypto';
import { env } from '../../../../shared/utils/env';
import { LLMValidatorService } from '../../domain/services/llm-validator.service';

@Injectable()
export class ValidateLLMConfigUseCase {
  private readonly logger = new Logger(ValidateLLMConfigUseCase.name);

  constructor(private readonly validatorService: LLMValidatorService) {}

  async execute(
    userId: string,
    data: ValidateLLMConfigRequest,
  ): Promise<LLMCapabilities> {
    let apiKey = data.apiKey || null;

    // If no API key provided, try to fetch and decrypt stored one
    if (!apiKey) {
      const stored = await LLMConfigModel.findOne({ userId }).lean();
      if (stored && stored.apiKey) {
        try {
          if (typeof stored.apiKey === 'string') {
            const decryptedKey = decrypt(stored.apiKey, env.ENCRYPTION_KEY);
            if (typeof decryptedKey === 'string') {
              apiKey = decryptedKey;
            }
          }
        } catch {
          this.logger.error(
            '[ValidateLLMConfig] Failed to decrypt stored API key',
          );
        }
      }
    }

    return this.validatorService.validate(
      data.provider,
      apiKey,
      data.baseUrl || null,
      data.chatModel,
      data.embeddingModel,
    );
  }
}
