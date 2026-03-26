import { Body, Controller, Get, Post, Req, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LegalService } from '../application/legal.service';
import { User } from '../../../shared/decorators/user.decorator';
import { Request } from 'express';
import { AcceptConsentDto, ConsentStatus, LegalDocument } from '@repo/types';
import { Public } from '../../../shared/decorators/public.decorator';

@ApiTags('Legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('privacy-policy')
  @Public()
  @ApiOperation({ summary: 'Get current active privacy policy' })
  async getPrivacyPolicy(): Promise<LegalDocument> {
    return this.legalService.getActivePolicy('privacy');
  }

  @Get('cookie-policy')
  @Public()
  @ApiOperation({ summary: 'Get current active cookie policy' })
  async getCookiePolicy(): Promise<LegalDocument> {
    return this.legalService.getActivePolicy('cookie');
  }

  @Get('terms-of-service')
  @Public()
  @ApiOperation({ summary: 'Get current active terms of service' })
  async getTermsOfService(): Promise<LegalDocument> {
    return this.legalService.getActivePolicy('terms');
  }

  @Post('accept')
  @Public() // Allow anonymous consent
  @ApiOperation({ summary: 'Accept privacy/cookie/terms policies' })
  async acceptPolicy(
    @User('userId') userId: string | undefined, // userId might be null for anonymous
    @Body() dto: AcceptConsentDto & { anonymousId?: string },
    @Req() request: Request,
  ): Promise<ConsentStatus> {
    const ip = this.getIpAddress(request);
    const ua = request.get('user-agent') || 'unknown';
    const { anonymousId, ...acceptDto } = dto;
    return this.legalService.acceptConsent(
      userId,
      anonymousId,
      acceptDto,
      ip,
      ua,
    );
  }

  @Get('consent-status')
  @Public() // Allow checking status for anonymous
  @ApiOperation({ summary: 'Get current user consent status' })
  async getConsentStatus(
    @User('userId') userId: string | undefined,
    @Query('anonymousId') anonymousId?: string,
  ): Promise<ConsentStatus> {
    return this.legalService.getConsentStatus(userId, anonymousId);
  }

  private getIpAddress(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0]?.trim() || 'unknown';
    }
    const ip = request.ip;
    return typeof ip === 'string' ? ip : 'unknown';
  }
}
