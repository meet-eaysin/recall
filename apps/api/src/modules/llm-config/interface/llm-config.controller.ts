import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { DevUserGuard } from '../../../shared/guards/dev-user.guard';
import { User } from '../../../shared/decorators/user.decorator';
import { GetLLMConfigUseCase } from '../application/use-cases/get-llm-config.usecase';
import { SaveLLMConfigUseCase } from '../application/use-cases/save-llm-config.usecase';
import { ValidateLLMConfigUseCase } from '../application/use-cases/validate-llm-config.usecase';
import { LLMConfigModel } from '@repo/db';
import { Types } from 'mongoose';
import { SaveLLMConfigDto, ValidateLLMConfigDto } from './dtos/llm-config.dto';
import { LLMConfigPublicViewDto } from './dtos/llm-config.response.dto';
import { ApiSuccessResponse } from '../../../common/decorators/api-success-response.decorator';

@ApiTags('Integrations: LLM Configuration')
@ApiBearerAuth('bearerAuth')
@Controller('llm-config')
@UseGuards(DevUserGuard)
export class LLMConfigController {
  constructor(
    private readonly getUseCase: GetLLMConfigUseCase,
    private readonly saveUseCase: SaveLLMConfigUseCase,
    private readonly validateUseCase: ValidateLLMConfigUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current LLM configuration' })
  @ApiSuccessResponse(LLMConfigPublicViewDto)
  async getConfig(@User('userId') userId: string) {
    const result = await this.getUseCase.execute(userId);
    return result;
  }

  @Put()
  @ApiOperation({ summary: 'Save new LLM provider configuration' })
  @ApiSuccessResponse(LLMConfigPublicViewDto)
  async saveConfig(
    @User('userId') userId: string,
    @Body() dto: SaveLLMConfigDto,
  ) {
    const result = await this.saveUseCase.execute(userId, dto);
    return result;
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate current LLM configuration settings' })
  @ApiSuccessResponse(LLMConfigPublicViewDto)
  async validateConfig(
    @User('userId') userId: string,
    @Body() dto: ValidateLLMConfigDto,
  ) {
    const result = await this.validateUseCase.execute(userId, dto);
    return result;
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete LLM configuration' })
  @ApiNoContentResponse({
    description: 'LLM configuration deleted successfully',
  })
  async deleteConfig(@User('userId') userId: string) {
    await LLMConfigModel.deleteOne({
      userId: new Types.ObjectId(userId),
    });
  }
}
