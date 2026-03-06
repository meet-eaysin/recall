import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConnectNotionUseCase } from '../application/use-cases/connect-notion.usecase';
import { ListNotionDatabasesUseCase } from '../application/use-cases/list-notion-databases.usecase';
import { UpdateNotionConfigUseCase } from '../application/use-cases/update-notion-config.usecase';
import { SyncAllToNotionUseCase } from '../application/use-cases/sync-all-to-notion.usecase';
import { DisconnectNotionUseCase } from '../application/use-cases/disconnect-notion.usecase';
import { NotionConfigModel } from '@repo/db';
import { DevUserGuard } from '../../../shared/guards/dev-user.guard';
import { User } from '../../../shared/decorators/user.decorator';
import { ConnectNotionDto, UpdateNotionConfigDto } from './dtos/notion.dto';
import {
  NotionConfigPublicViewDto,
  NotionDatabaseDto,
  NotionSyncResultDto,
} from './dtos/notion.response.dto';
import { ApiSuccessResponse } from 'src/shared/decorators/api-success-response.decorator';

@ApiTags('Integrations: Notion')
@ApiBearerAuth('bearerAuth')
@Controller('notion')
@UseGuards(DevUserGuard)
export class NotionController {
  constructor(
    private readonly connectUseCase: ConnectNotionUseCase,
    private readonly listDatabasesUseCase: ListNotionDatabasesUseCase,
    private readonly updateConfigUseCase: UpdateNotionConfigUseCase,
    private readonly syncUseCase: SyncAllToNotionUseCase,
    private readonly disconnectUseCase: DisconnectNotionUseCase,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Get current Notion configuration for the user' })
  @ApiSuccessResponse(NotionConfigPublicViewDto)
  async getConfig(@User('userId') userId: string) {
    const config = await NotionConfigModel.findOne({
      userId,
    });
    if (!config) throw new NotFoundException('Not connected');

    return {
      userId: config.userId.toString(),
      workspaceId: config.workspaceId,
      workspaceName: config.workspaceName,
      targetDatabaseId: config.targetDatabaseId,
      syncEnabled: config.syncEnabled,
      syncDirection: config.syncDirection,
      lastSyncedAt: config.lastSyncedAt?.toISOString(),
    };
  }

  @Post('connect')
  @ApiOperation({ summary: 'Connect a Notion account using an access token' })
  @ApiSuccessResponse(NotionConfigPublicViewDto, 'Account connected')
  @HttpCode(HttpStatus.CREATED)
  async connect(@User('userId') userId: string, @Body() dto: ConnectNotionDto) {
    const result = await this.connectUseCase.execute(userId, dto.accessToken);
    return result;
  }

  @Get('databases')
  @ApiOperation({
    summary: 'List available Notion databases for the connected account',
  })
  @ApiSuccessResponse(NotionDatabaseDto, 'Databases retrieved', true)
  async listDatabases(@User('userId') userId: string) {
    const result = await this.listDatabasesUseCase.execute(userId);
    return result;
  }

  @Patch('config')
  @ApiOperation({ summary: 'Update Notion sync configuration' })
  @ApiSuccessResponse(NotionConfigPublicViewDto)
  async updateConfig(
    @User('userId') userId: string,
    @Body() dto: UpdateNotionConfigDto,
  ) {
    const result = await this.updateConfigUseCase.execute(userId, dto);
    return result;
  }

  @Post('sync')
  @ApiOperation({ summary: 'Manually trigger a Notion sync' })
  @ApiSuccessResponse(NotionSyncResultDto, 'Sync completed')
  @HttpCode(HttpStatus.OK)
  async sync(@User('userId') userId: string) {
    const result = await this.syncUseCase.execute(userId);
    return result;
  }

  @Delete('config')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect Notion account' })
  async disconnect(@User('userId') userId: string) {
    await this.disconnectUseCase.execute(userId);
  }
}
