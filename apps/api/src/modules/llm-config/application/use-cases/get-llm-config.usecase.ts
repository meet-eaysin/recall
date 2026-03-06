import { Injectable, NotFoundException } from '@nestjs/common';
import { LLMConfigPublicView } from '@repo/types';
import { ILLMConfigRepository } from '../../domain/repositories/llm-config.repository';

@Injectable()
export class GetLLMConfigUseCase {
  constructor(private readonly llmConfigRepository: ILLMConfigRepository) {}

  async execute(userId: string): Promise<LLMConfigPublicView> {
    const entity = await this.llmConfigRepository.findByUserId(userId);

    if (!entity) {
      throw new NotFoundException('LLM configuration not found');
    }

    return entity.toPublicView();
  }
}
