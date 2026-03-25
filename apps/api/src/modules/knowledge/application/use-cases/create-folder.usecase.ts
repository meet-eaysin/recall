import { Injectable, BadRequestException } from '@nestjs/common';
import { IFolderRepository } from '../../domain/repositories/folder.repository';
import { FolderPublicView } from '../../domain/entities/folder.entity';

interface CreateFolderCommand {
  userId: string;
  name: string;
  description?: string | undefined;
  color?: string | undefined;
  parentId?: string | undefined;
}

@Injectable()
export class CreateFolderUseCase {
  constructor(private readonly folderRepository: IFolderRepository) {}

  async execute(command: CreateFolderCommand): Promise<FolderPublicView> {
    const existing = await this.folderRepository.findByName(
      command.name,
      command.userId,
      command.parentId,
    );

    if (existing) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [
          {
            field: 'name',
            messages: ['A folder with this name already exists'],
          },
        ],
      });
    }

    const folder = await this.folderRepository.create({
      userId: command.userId,
      name: command.name,
      description: command.description,
      color: command.color,
      parentId: command.parentId,
    });

    return folder.toPublicView();
  }
}
