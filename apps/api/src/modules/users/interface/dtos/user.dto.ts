import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'The new name of the user' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'The new email of the user' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'The new avatar URL of the user' })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}
