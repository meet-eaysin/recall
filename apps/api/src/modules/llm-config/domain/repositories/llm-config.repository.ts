import type { LLMConfigEntity } from '../entities/llm-config.entity';

export abstract class ILLMConfigRepository {
  abstract findByUserId(userId: string): Promise<LLMConfigEntity | null>;
  abstract save(entity: LLMConfigEntity): Promise<void>;
}
