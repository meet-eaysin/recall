import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '@repo/types';
import { Request } from 'express';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { TokenService } from '../../domain/services/token.service';
import { IExternalIdentityRepository } from '../../domain/repositories/external-identity.repository';
import { OAuthProviderService } from '../../infrastructure/oauth/oauth-provider.service';
import { RefreshSessionService } from '../../domain/services/refresh-session.service';

@Injectable()
export class HandleOAuthCallbackUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly externalIdentityRepository: IExternalIdentityRepository,
    private readonly oAuthProviderService: OAuthProviderService,
    private readonly tokenService: TokenService,
    private readonly refreshSessionService: RefreshSessionService,
  ) {}

  async execute(input: {
    provider: AuthProvider;
    request: Request;
    redirectUri: string;
    expectedState: string;
    codeVerifier: string;
  }) {
    const profile = await this.oAuthProviderService.handleCallback(input);

    let user = await this.externalIdentityRepository.findByProviderIdentity(
      profile.provider,
      profile.providerUserId,
    );

    let internalUser =
      user && (await this.userRepository.findById(user.userId));

    if (!internalUser && profile.emailVerified && profile.email) {
      internalUser = await this.userRepository.findByEmail(profile.email);
    }

    if (!internalUser) {
      internalUser = await this.userRepository.create({
        authId: `${profile.provider}:${profile.providerUserId}`,
        email:
          profile.email ??
          `${profile.provider}-${profile.providerUserId}@users.local`,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      });
    }

    await this.externalIdentityRepository.link({
      userId: internalUser.id,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      email: profile.email,
      emailVerified: profile.emailVerified,
      profileSnapshot: profile.profileSnapshot,
    });

    const authenticatedUser = {
      userId: internalUser.id,
      authId: internalUser.authId,
      email: internalUser.props.email,
      name: internalUser.props.name,
      avatarUrl: internalUser.props.avatarUrl,
      provider: profile.provider,
    } as const;

    const tokens = await this.tokenService.issueSession({
      user: authenticatedUser,
    });

    await this.refreshSessionService.createSession({
      user: authenticatedUser,
      tokens,
      userAgent: input.request.headers['user-agent'],
      ipAddress: this.getIpAddress(input.request),
    });

    return { user: authenticatedUser, tokens };
  }

  private getIpAddress(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0]?.trim();
    }

    return request.ip || undefined;
  }
}
