import { ApiProperty } from '@nestjs/swagger';
import type { UserSessionView } from '@repo/types';

export class UserSessionViewDto implements UserSessionView {
  @ApiProperty()
  sessionId!: string;

  @ApiProperty({ nullable: true })
  userAgent!: string | null;

  @ApiProperty({ nullable: true })
  ipAddress!: string | null;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty()
  current!: boolean;
}
