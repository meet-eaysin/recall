import { Injectable } from '@nestjs/common';
import type {
  NotionConfigPublicView,
  UpdateNotionConfigRequest,
} from '@repo/types';
import { INotionConfigRepository } from '../../domain/repositories/notion-config.repository';
import { NotionConfigEntity } from '../../domain/entities/notion-config.entity';
import { NotFoundDomainException } from '../../../../shared/errors/not-found.exception';

@Injectable()
export class UpdateNotionConfigUseCase {
  constructor(
    private readonly notionConfigRepository: INotionConfigRepository,
  ) {}

  async execute(
    userId: string,
    data: UpdateNotionConfigRequest,
  ): Promise<NotionConfigPublicView> {
    const entity = await this.notionConfigRepository.findByUserId(userId);

    if (!entity) {
      throw new NotFoundDomainException('Notion not connected');
    }

    const updatedEntity = new NotionConfigEntity({
      ...entity.props,
      ...data,
      updatedAt: new Date(),
    });

    await this.notionConfigRepository.save(updatedEntity);

    return updatedEntity.toPublicView();
  }
}
