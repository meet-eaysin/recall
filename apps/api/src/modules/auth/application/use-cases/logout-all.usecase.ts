import { Injectable } from '@nestjs/common';
import { RefreshSessionService } from '../../domain/services/refresh-session.service';

@Injectable()
export class LogoutAllUseCase {
  constructor(private readonly refreshSessionService: RefreshSessionService) {}

  async execute(userId: string): Promise<{ success: true }> {
    await this.refreshSessionService.revokeAllSessions(userId);
    return { success: true };
  }
}
