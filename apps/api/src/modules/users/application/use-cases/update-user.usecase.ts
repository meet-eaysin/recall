import { Injectable, NotFoundException } from '@nestjs/common';
import type { UserPublicView } from '@repo/types';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { UpdateUserDto } from '../../interface/dtos/user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, dto: UpdateUserDto): Promise<UserPublicView> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.userRepository.update(userId, {
      name: dto.name,
      email: dto.email,
      avatarUrl: dto.avatarUrl,
    });

    return updatedUser.toPublicView();
  }
}
