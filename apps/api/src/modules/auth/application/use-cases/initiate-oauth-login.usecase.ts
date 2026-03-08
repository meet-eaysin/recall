import { Injectable } from '@nestjs/common';
import { AuthProvider } from '@repo/types';
import { OAuthProviderService } from '../../infrastructure/oauth/oauth-provider.service';

@Injectable()
export class InitiateOAuthLoginUseCase {
  constructor(private readonly oAuthProviderService: OAuthProviderService) {}

  async execute(provider: AuthProvider) {
    const state = await this.oAuthProviderService.generateState();
    const codeVerifier = await this.oAuthProviderService.generateCodeVerifier();
    const { authorizationUrl, redirectUri } =
      await this.oAuthProviderService.buildAuthorizationUrl({
        provider,
        state,
        codeVerifier,
      });

    return {
      provider,
      state,
      codeVerifier,
      redirectUri,
      authorizationUrl,
    };
  }
}
