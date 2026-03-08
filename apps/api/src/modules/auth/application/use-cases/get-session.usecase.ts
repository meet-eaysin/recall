import { Injectable } from '@nestjs/common';
import { AuthenticatedUser, AuthSessionView } from '@repo/types';

@Injectable()
export class GetSessionUseCase {
  execute(user: AuthenticatedUser): AuthSessionView {
    return {
      authenticated: true,
      user: {
        id: user.userId,
        email: user.email ?? null,
        name: user.name ?? null,
        avatarUrl: user.avatarUrl ?? null,
        provider: user.provider ?? null,
      },
      session: {
        id: user.sessionId ?? null,
      },
    };
  }
}
