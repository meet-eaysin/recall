import { Injectable } from '@nestjs/common';
import { RefreshSessionService } from '../../domain/services/refresh-session.service';

@Injectable()
export class RefreshSessionUseCase {
  constructor(private readonly refreshSessionService: RefreshSessionService) {}

  async execute(refreshToken: string) {
    return this.refreshSessionService.rotateSession(refreshToken);
  }
}
