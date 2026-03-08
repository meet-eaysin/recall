import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, AuthProvider } from '@repo/types';
import { GetSessionUseCase } from '../application/use-cases/get-session.usecase';
import { ApiSuccessResponse } from '../../../shared/decorators/api-success-response.decorator';
import { User } from '../../../shared/decorators/user.decorator';
import { AuthSessionResponseDto } from './dtos/auth.response.dto';
import { Public } from '../../../shared/decorators/public.decorator';
import { DevLoginDto } from './dtos/dev-login.dto';
import { DevLoginUseCase } from '../application/use-cases/dev-login.usecase';
import { AuthCookieService } from '../infrastructure/cookies/auth-cookie.service';
import { Response, Request } from 'express';
import { RefreshSessionUseCase } from '../application/use-cases/refresh-session.usecase';
import { LogoutUseCase } from '../application/use-cases/logout.usecase';
import { LogoutAllUseCase } from '../application/use-cases/logout-all.usecase';
import { InitiateOAuthLoginUseCase } from '../application/use-cases/initiate-oauth-login.usecase';
import { OAuthTransactionCookieService } from '../infrastructure/cookies/oauth-transaction-cookie.service';
import { HandleOAuthCallbackUseCase } from '../application/use-cases/handle-oauth-callback.usecase';
import { env } from '../../../shared/utils/env';

@ApiTags('Auth')
@ApiBearerAuth('bearerAuth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly getSessionUseCase: GetSessionUseCase,
    private readonly devLoginUseCase: DevLoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly logoutAllUseCase: LogoutAllUseCase,
    private readonly authCookieService: AuthCookieService,
    private readonly initiateOAuthLoginUseCase: InitiateOAuthLoginUseCase,
    private readonly oauthTransactionCookieService: OAuthTransactionCookieService,
    private readonly handleOAuthCallbackUseCase: HandleOAuthCallbackUseCase,
  ) {}

  @Get('session')
  @ApiOperation({
    summary: 'Get current authenticated session',
    description: 'Return the current authenticated application session.',
  })
  @ApiSuccessResponse(AuthSessionResponseDto)
  getSession(@User() user: AuthenticatedUser) {
    return this.getSessionUseCase.execute(user);
  }

  @Post('dev/login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a development login session',
    description:
      'Development-only session bootstrap that mints application cookies using the real token path.',
  })
  @ApiSuccessResponse(AuthSessionResponseDto)
  async devLogin(
    @Body() body: DevLoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.devLoginUseCase.execute(body, {
      userAgent: request.headers['user-agent'],
      ipAddress: this.getIpAddress(request),
    });
    this.authCookieService.setSessionCookies(response, result.tokens);
    return this.getSessionUseCase.execute({
      ...result.user,
      sessionId: result.tokens.sessionId,
    });
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh the current application session',
  })
  @ApiSuccessResponse(AuthSessionResponseDto)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.authCookieService.getRefreshToken(request);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const result = await this.refreshSessionUseCase.execute(refreshToken);
    this.authCookieService.setSessionCookies(response, result.tokens);
    return this.getSessionUseCase.execute({
      ...result.user,
      sessionId: result.tokens.sessionId,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout current application session',
  })
  @ApiSuccessResponse(undefined, 'Logged out successfully')
  async logout(
    @User() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.authCookieService.clearSessionCookies(response);
    return this.logoutUseCase.execute(user);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout all application sessions',
  })
  @ApiSuccessResponse(undefined, 'All sessions revoked successfully')
  async logoutAll(
    @User('userId') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.authCookieService.clearSessionCookies(response);
    return this.logoutAllUseCase.execute(userId);
  }

  @Get('google')
  @Public()
  @ApiOperation({
    summary: 'Start Google login',
    description: 'Start Google OAuth login using authorization code + PKCE.',
  })
  async startGoogleLogin(@Res() response: Response) {
    const transaction = await this.initiateOAuthLoginUseCase.execute('google');
    await this.oauthTransactionCookieService.setTransactionCookie(response, {
      provider: transaction.provider,
      state: transaction.state,
      codeVerifier: transaction.codeVerifier,
      redirectUri: transaction.redirectUri,
    });
    return response.redirect(transaction.authorizationUrl);
  }

  @Get('github')
  @Public()
  @ApiOperation({
    summary: 'Start GitHub login',
    description: 'Start GitHub OAuth login using authorization code + PKCE.',
  })
  async startGithubLogin(@Res() response: Response) {
    const transaction = await this.initiateOAuthLoginUseCase.execute('github');
    await this.oauthTransactionCookieService.setTransactionCookie(response, {
      provider: transaction.provider,
      state: transaction.state,
      codeVerifier: transaction.codeVerifier,
      redirectUri: transaction.redirectUri,
    });
    return response.redirect(transaction.authorizationUrl);
  }

  @Get('google/callback')
  @Public()
  @ApiOperation({
    summary: 'Handle Google OAuth callback',
  })
  async googleCallback(@Req() request: Request, @Res() response: Response) {
    return this.handleProviderCallback('google', request, response);
  }

  @Get('github/callback')
  @Public()
  @ApiOperation({
    summary: 'Handle GitHub OAuth callback',
  })
  async githubCallback(@Req() request: Request, @Res() response: Response) {
    return this.handleProviderCallback('github', request, response);
  }

  private async handleProviderCallback(
    provider: AuthProvider,
    request: Request,
    response: Response,
  ) {
    const transaction =
      await this.oauthTransactionCookieService.readTransactionCookie(request);

    if (transaction.provider !== provider) {
      throw new UnauthorizedException('OAuth provider mismatch');
    }

    const result = await this.handleOAuthCallbackUseCase.execute({
      provider,
      request,
      redirectUri: transaction.redirectUri,
      expectedState: transaction.state,
      codeVerifier: transaction.codeVerifier,
    });

    this.oauthTransactionCookieService.clearTransactionCookie(response);
    this.authCookieService.setSessionCookies(response, result.tokens);

    if (env.WEB_APP_URL) {
      return response.redirect(env.WEB_APP_URL);
    }

    return response.json(
      this.getSessionUseCase.execute({
        ...result.user,
        sessionId: result.tokens.sessionId,
      }),
    );
  }

  private getIpAddress(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0]?.trim();
    }

    return request.ip || undefined;
  }
}
