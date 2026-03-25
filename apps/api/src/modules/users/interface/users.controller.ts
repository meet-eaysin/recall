import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@repo/types';
import { GetMeUseCase } from '../application/use-cases/get-me.usecase';
import { ApiSuccessResponse } from '../../../shared/decorators/api-success-response.decorator';
import { User } from '../../../shared/decorators/user.decorator';
import { UserPublicViewDto } from './dtos/user.response.dto';
import { ListUserSessionsUseCase } from '../application/use-cases/list-user-sessions.usecase';
import { RevokeUserSessionUseCase } from '../application/use-cases/revoke-user-session.usecase';
import { UpdateUserUseCase } from '../application/use-cases/update-user.usecase';
import { UpdateUserDto } from './dtos/user.dto';
import { UserSessionViewDto } from './dtos/user-session.response.dto';

@ApiTags('Users')
@ApiBearerAuth('bearerAuth')
@Controller('users')
export class UsersController {
  constructor(
    private readonly getMeUseCase: GetMeUseCase,
    private readonly listUserSessionsUseCase: ListUserSessionsUseCase,
    private readonly revokeUserSessionUseCase: RevokeUserSessionUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Current implementation resolves the authenticated user from the active request identity.',
  })
  @ApiSuccessResponse(UserPublicViewDto)
  getMe(@User('userId') userId: string) {
    return this.getMeUseCase.execute(userId);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
  })
  @ApiSuccessResponse(UserPublicViewDto)
  updateMe(
    @User('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.updateUserUseCase.execute(userId, dto);
  }

  @Get('me/sessions')
  @ApiOperation({
    summary: 'List active sessions for the current user',
  })
  @ApiSuccessResponse(UserSessionViewDto, 'User sessions', true)
  listSessions(@User() user: AuthenticatedUser) {
    return this.listUserSessionsUseCase.execute(user.userId, user.sessionId);
  }

  @Delete('me/sessions/:sessionId')
  @ApiOperation({
    summary: 'Revoke one non-current user session',
  })
  @ApiSuccessResponse(undefined, 'Session revoked successfully')
  async revokeSession(
    @User() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
  ) {
    await this.revokeUserSessionUseCase.execute(
      user.userId,
      sessionId,
      user.sessionId,
    );
    return { success: true };
  }
}
