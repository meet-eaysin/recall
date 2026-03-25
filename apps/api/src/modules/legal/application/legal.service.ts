import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { AcceptConsentDto, ConsentStatus, LegalDocumentType } from '@repo/types';
import { ILegalRepository } from '../domain/repositories/legal.repository';
import { IUserRepository } from '../../users/domain/repositories/user.repository';
import { ILegalDocument } from '@repo/db';

@Injectable()
export class LegalService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LegalService.name);
  private readonly CURRENT_VERSION = '1.0';

  constructor(
    private readonly legalRepository: ILegalRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async onApplicationBootstrap() {
    await this.seedPolicies();
  }

  private async seedPolicies() {
    const policies: Partial<ILegalDocument>[] = [
      {
        type: 'privacy',
        version: this.CURRENT_VERSION,
        title: 'Privacy Policy',
        content: `
# Privacy Policy for Recall

Effective Date: March 26, 2026

## 1. Information We Collect
Recall collects personal knowledge information, including:
- Uploaded documents (PDFs, images, text)
- Extracted transcripts from audio/video
- Vector embeddings of your data (stored in Qdrant)
- Chat interactions with our AI assistant

## 2. How We Use Your Data
Your data is used solely to provide personal knowledge management services. We use:
- OpenRouter and third-party LLM providers to process your queries.
- Persistent storage in MongoDB and Redis for session management.
- Qdrant for semantic search and retrieval.

## 3. Data Sharing and Processing
We do NOT sell your data. Data is shared with AI providers (via OpenRouter) strictly for processing your requests. These providers are bound by their own privacy policies.

## 4. Your Rights
You have the right to:
- Access your data
- Request deletion of your account and all associated data
- Export your knowledge graph

## 5. Contact
For privacy-related inquiries, contact privacy@recall.ai
        `,
        effectiveDate: new Date(),
      },
      {
        type: 'cookie',
        version: this.CURRENT_VERSION,
        title: 'Cookie Policy',
        content: `
# Cookie Policy for Recall

Effective Date: March 26, 2026

## 1. What are Cookies?
Cookies are small text files stored on your device to enhance your experience.

## 2. How We Use Cookies
- **Essential Cookies**: Necessary for authentication and session management.
- **Functional Cookies**: Used to remember your preferences (e.g., theme, LLM settings).
- **Analytics Cookies**: Help us understand how you use Recall to improve the service.

## 3. Managing Cookies
You can manage or disable cookies through your browser settings, though some features of Recall may not function correctly without them.
        `,
        effectiveDate: new Date(),
      },
    ];

    for (const policy of policies) {
      if (!policy.type || !policy.version) continue;
      const existing = await this.legalRepository.findByVersion(policy.type as LegalDocumentType, policy.version as string);
      if (!existing) {
        await this.legalRepository.create(policy);
        this.logger.log(`Seeded ${policy.type} policy version ${policy.version}`);
      }
    }
  }

  async getActivePolicy(type: LegalDocumentType) {
    const policy = await this.legalRepository.findActivePolicy(type);
    if (!policy) {
      throw new Error(`${type} policy not found`);
    }
    return policy;
  }

  async getConsentStatus(userId: string): Promise<ConsentStatus> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentVersion = user.consentVersion === this.CURRENT_VERSION;

    return {
      privacyAccepted: isCurrentVersion && !!user.privacyPolicyAcceptedAt,
      cookieAccepted: isCurrentVersion && !!user.cookiePolicyAcceptedAt,
      requiredVersion: this.CURRENT_VERSION,
    };
  }

  async acceptConsent(
    userId: string,
    dto: AcceptConsentDto,
    ip: string,
    userAgent: string,
  ): Promise<ConsentStatus> {
    const update: {
      consentVersion: string;
      consentIp: string;
      consentUserAgent: string;
      privacyPolicyAcceptedAt?: Date;
      cookiePolicyAcceptedAt?: Date;
    } = {
      consentVersion: dto.version,
      consentIp: ip,
      consentUserAgent: userAgent,
    };

    if (dto.types.includes('privacy')) {
      update.privacyPolicyAcceptedAt = new Date();
    }
    if (dto.types.includes('cookie')) {
      update.cookiePolicyAcceptedAt = new Date();
    }

    await this.userRepository.update(userId, update);
    return this.getConsentStatus(userId);
  }

  getCurrentVersion(): string {
    return this.CURRENT_VERSION;
  }
}
