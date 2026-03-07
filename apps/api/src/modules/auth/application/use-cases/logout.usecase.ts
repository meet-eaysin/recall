import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../../../shared/types/authenticated-user.type';
import { RefreshSessionService } from '../../domain/services/refresh-session.service';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly refreshSessionService: RefreshSessionService) {}

  async execute(user: AuthenticatedUser): Promise<{ success: true }> {
    await this.refreshSessionService.revokeCurrentSession(user);
    return { success: true };
  }
}
