import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LegalService } from '../application/legal.service';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
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
    const policy = await this.legalService.getActivePolicy('privacy');
    return {
      id: policy.id,
      type: policy.type,
      version: policy.version,
      title: policy.title,
      content: policy.content,
      effectiveDate: policy.effectiveDate,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  }

  @Get('cookie-policy')
  @Public()
  @ApiOperation({ summary: 'Get current active cookie policy' })
  async getCookiePolicy(): Promise<LegalDocument> {
    const policy = await this.legalService.getActivePolicy('cookie');
    return {
      id: policy.id,
      type: policy.type,
      version: policy.version,
      title: policy.title,
      content: policy.content,
      effectiveDate: policy.effectiveDate,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  }

  @Post('accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Accept privacy/cookie policies' })
  async acceptPolicy(
    @User('userId') userId: string,
    @Body() dto: AcceptConsentDto,
    @Req() request: Request,
  ): Promise<ConsentStatus> {
    const ip = this.getIpAddress(request);
    const ua = (request.headers['user-agent'] as string) || 'unknown';
    return this.legalService.acceptConsent(userId, dto, ip, ua);
  }

  @Get('consent-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Get current user consent status' })
  async getConsentStatus(@User('userId') userId: string): Promise<ConsentStatus> {
    return this.legalService.getConsentStatus(userId);
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
