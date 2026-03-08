import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthProvider } from '@repo/types';
import { Request } from 'express';
import { env } from '../../../../shared/utils/env';
import { OAuthProfile } from '../../domain/entities/oauth-profile.entity';

type OpenIdClientModule = typeof import('openid-client');

@Injectable()
export class OAuthProviderService {
  private openIdClientPromise: Promise<OpenIdClientModule> | null = null;

  async buildAuthorizationUrl(input: {
    provider: AuthProvider;
    state: string;
    codeVerifier: string;
  }): Promise<{ authorizationUrl: string; redirectUri: string }> {
    const client = await this.getClientModule();
    const config = await this.getConfiguration(input.provider);
    const redirectUri = this.getRedirectUri(input.provider);
    const scope = this.getScope(input.provider);
    const codeChallenge = await client.calculatePKCECodeChallenge(
      input.codeVerifier,
    );

    const authorizationUrl = client.buildAuthorizationUrl(config, {
      redirect_uri: redirectUri,
      scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: input.state,
    });

    return {
      authorizationUrl: authorizationUrl.href,
      redirectUri,
    };
  }

  async handleCallback(input: {
    provider: AuthProvider;
    request: Request;
    redirectUri: string;
    expectedState: string;
    codeVerifier: string;
  }): Promise<OAuthProfile> {
    const client = await this.getClientModule();
    const config = await this.getConfiguration(input.provider);
    const callbackUrl = new URL(input.redirectUri);

    for (const [key, value] of Object.entries(input.request.query)) {
      if (typeof value === 'string') {
        callbackUrl.searchParams.set(key, value);
      }
    }

    const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
      pkceCodeVerifier: input.codeVerifier,
      expectedState: input.expectedState,
    });

    if (!tokens.access_token) {
      throw new BadRequestException('Provider did not return an access token');
    }

    return input.provider === 'google'
      ? this.getGoogleProfile(config, tokens.access_token, tokens.claims())
      : this.getGithubProfile(tokens.access_token);
  }

  async generateState(): Promise<string> {
    const client = await this.getClientModule();
    return client.randomState();
  }

  async generateCodeVerifier(): Promise<string> {
    const client = await this.getClientModule();
    return client.randomPKCECodeVerifier();
  }

  private async getGoogleProfile(
    config: Awaited<ReturnType<OAuthProviderService['getConfiguration']>>,
    accessToken: string,
    claims?: {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    },
  ): Promise<OAuthProfile> {
    const client = await this.getClientModule();
    const expectedSubject = claims?.sub ?? client.skipSubjectCheck;
    const userInfo = (await client.fetchUserInfo(
      config,
      accessToken,
      expectedSubject,
    )) as Record<string, unknown>;

    const providerUserId = this.requireString(
      claims?.sub ?? userInfo.sub,
      'Google subject',
    );
    const email =
      typeof userInfo.email === 'string'
        ? userInfo.email
        : typeof claims?.email === 'string'
          ? claims.email
          : undefined;

    return {
      provider: 'google',
      providerUserId,
      email,
      emailVerified:
        Boolean(userInfo.email_verified) || Boolean(claims?.email_verified),
      name:
        (typeof userInfo.name === 'string' && userInfo.name) ||
        claims?.name ||
        'Google User',
      avatarUrl:
        typeof userInfo.picture === 'string'
          ? userInfo.picture
          : claims?.picture,
      profileSnapshot: userInfo,
    };
  }

  private async getGithubProfile(accessToken: string): Promise<OAuthProfile> {
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'mind-stack-auth',
      },
    });

    if (!userResponse.ok) {
      throw new BadRequestException('Failed to fetch GitHub profile');
    }

    const user = (await userResponse.json()) as Record<string, unknown>;

    let email =
      typeof user.email === 'string' && user.email.length > 0
        ? user.email
        : undefined;
    let emailVerified = false;

    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'mind-stack-auth',
        },
      });

      if (!emailResponse.ok) {
        throw new BadRequestException('Failed to fetch GitHub emails');
      }

      const emails = (await emailResponse.json()) as Record<string, unknown>[];
      const primary = emails.find(
        (entry) => entry.primary === true && typeof entry.email === 'string',
      );
      const verified = emails.find(
        (entry) => entry.verified === true && typeof entry.email === 'string',
      );
      const selected = primary ?? verified;
      if (selected && typeof selected.email === 'string') {
        email = selected.email;
        emailVerified = Boolean(selected.verified);
      }
    }

    return {
      provider: 'github',
      providerUserId: String(user.id),
      email,
      emailVerified,
      name:
        (typeof user.name === 'string' && user.name) ||
        (typeof user.login === 'string' && user.login) ||
        'GitHub User',
      avatarUrl:
        typeof user.avatar_url === 'string' ? user.avatar_url : undefined,
      profileSnapshot: user,
    };
  }

  private async getConfiguration(provider: AuthProvider) {
    const client = await this.getClientModule();

    if (provider === 'google') {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        throw new InternalServerErrorException(
          'Google OAuth is not configured',
        );
      }

      return client.discovery(
        new URL('https://accounts.google.com'),
        env.GOOGLE_CLIENT_ID,
        { client_secret: env.GOOGLE_CLIENT_SECRET },
        client.ClientSecretPost(env.GOOGLE_CLIENT_SECRET),
      );
    }

    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throw new InternalServerErrorException('GitHub OAuth is not configured');
    }

    return new client.Configuration(
      {
        issuer: 'https://github.com',
        authorization_endpoint: 'https://github.com/login/oauth/authorize',
        token_endpoint: 'https://github.com/login/oauth/access_token',
      },
      env.GITHUB_CLIENT_ID,
      { client_secret: env.GITHUB_CLIENT_SECRET },
      client.ClientSecretPost(env.GITHUB_CLIENT_SECRET),
    );
  }

  private getRedirectUri(provider: AuthProvider): string {
    const redirectUri =
      provider === 'google' ? env.GOOGLE_CALLBACK_URL : env.GITHUB_CALLBACK_URL;

    if (!redirectUri) {
      throw new InternalServerErrorException(
        `${provider} callback URL is not configured`,
      );
    }

    return redirectUri;
  }

  private getScope(provider: AuthProvider): string {
    return provider === 'google'
      ? 'openid email profile'
      : 'read:user user:email';
  }

  private async getClientModule(): Promise<OpenIdClientModule> {
    if (!this.openIdClientPromise) {
      this.openIdClientPromise = import('openid-client');
    }

    return this.openIdClientPromise;
  }

  private requireString(value: unknown, field: string): string {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    throw new BadRequestException(`Missing ${field}`);
  }
}
