import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@repo/types';
import { RefreshSessionService } from '../../domain/services/refresh-session.service';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly refreshSessionService: RefreshSessionService) {}

  async execute(user: AuthenticatedUser): Promise<{ success: true }> {
    await this.refreshSessionService.revokeCurrentSession(user);
    return { success: true };
  }
}
