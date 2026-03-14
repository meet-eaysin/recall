import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
} from '@nestjs/common';
import {
  LLMClientFactory,
  getProviderRegistry,
} from '@repo/ai';
import { encrypt } from '@repo/crypto';
import {
  UpdateLLMConfigRequest,
  LLMSettingsResponse,
  TestLLMConfigRequest,
} from '@repo/types';
import { User } from '../../../shared/decorators/user.decorator';
import { env } from '../../../shared/utils/env';

@Controller('user/settings/llm')
export class UserLlmSettingsController {
  constructor(
    private readonly llmClientFactory: LLMClientFactory,
  ) {}

  @Get()
  async getSettings(
    @User('userId') userId: string,
  ): Promise<LLMSettingsResponse> {
    const { UserModel } = await import('@repo/db');
    const user = await UserModel.findById(userId).select('llmConfig').lean();
    const config = user?.llmConfig;

    return {
      registry: getProviderRegistry(),
      config: config
        ? {
            providerId: config.providerId,
            modelId: config.modelId,
            embeddingModelId: config.embeddingModelId,
            useSystemDefault: config.useSystemDefault,
            hasApiKey: !!config.apiKey,
          }
        : null,
    };
  }

  @Patch()
  async updateSettings(
    @User('userId') userId: string,
    @Body() body: UpdateLLMConfigRequest,
  ): Promise<{ success: boolean; message: string }> {
    const { UserModel } = await import('@repo/db');
    const user = await UserModel.findById(userId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const llmConfig = user.llmConfig || {
      useSystemDefault: true,
      providerId: '',
      modelId: '',
    };

    if (body.useSystemDefault !== undefined) {
      llmConfig.useSystemDefault = body.useSystemDefault;
    }

    if (body.providerId !== undefined) {
      llmConfig.providerId = body.providerId;
    }

    if (body.modelId !== undefined) {
      llmConfig.modelId = body.modelId;
    }

    if (body.embeddingModelId !== undefined) {
      llmConfig.embeddingModelId = body.embeddingModelId;
    }

    if (body.apiKey !== undefined) {
      if (body.apiKey.trim() === '') {
        llmConfig.apiKey = undefined;
      } else {
        llmConfig.apiKey = encrypt(body.apiKey, env.ENCRYPTION_KEY);
      }
    }

    user.llmConfig = llmConfig;
    await user.save();

    return { success: true, message: 'LLM configuration updated successfully' };
  }

  @Post('test')
  async testConfig(
    @User('userId') _userId: string,
    @Body() body: TestLLMConfigRequest,
  ): Promise<{ success: boolean; message: string; response?: string }> {
    try {
      const testConfig = {
        providerId: body.providerId,
        modelId: body.modelId,
        apiKey: body.apiKey ? encrypt(body.apiKey, env.ENCRYPTION_KEY) : undefined,
        useSystemDefault: body.useSystemDefault,
      };

      const resolvedClient = await this.llmClientFactory.createForUser(testConfig);

      const response = await resolvedClient.complete({
        messages: [{ role: 'user', content: body.message || 'Hello! Test my connection.' }],
      });

      return {
        success: true,
        message: 'Connection successful',
        response,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}
