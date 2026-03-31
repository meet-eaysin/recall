import { Injectable } from '@nestjs/common';
import type { NotionConfigPublicView } from '@repo/types';
import { INotionConfigRepository } from '../../domain/repositories/notion-config.repository';
import { NotFoundDomainException } from '../../../../shared/errors/not-found.exception';

@Injectable()
export class GetNotionConfigUseCase {
  constructor(
    private readonly notionConfigRepository: INotionConfigRepository,
  ) {}

  async execute(userId: string): Promise<NotionConfigPublicView> {
    const config = await this.notionConfigRepository.findByUserId(userId);
    if (!config) throw new NotFoundDomainException('Not connected');

    return config.toPublicView();
  }
}
