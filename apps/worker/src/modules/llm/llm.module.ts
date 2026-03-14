import { Module, Global } from '@nestjs/common';
import { LLMClientFactory } from '@repo/ai';

@Global()
@Module({
  providers: [LLMClientFactory],
  exports: [LLMClientFactory],
})
export class LlmModule {}
