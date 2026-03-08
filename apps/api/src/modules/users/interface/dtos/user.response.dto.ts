import { ApiProperty } from '@nestjs/swagger';
import type { UserPublicView } from '@repo/types';

export class UserPublicViewDto implements UserPublicView {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;
}
