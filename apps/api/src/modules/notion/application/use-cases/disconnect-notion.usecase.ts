import { Injectable } from '@nestjs/common';
import { INotionConfigRepository } from '../../domain/repositories/notion-config.repository';

@Injectable()
export class DisconnectNotionUseCase {
  constructor(private readonly notionConfigRepository: INotionConfigRepository) {}

  async execute(userId: string): Promise<void> {
    await this.notionConfigRepository.deleteByUserId(userId);
  }
}
