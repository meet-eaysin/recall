import { ApiProperty } from '@nestjs/swagger';
import type {
  AuthSessionUser,
  AuthSessionView,
  IdentityProvider,
} from '@repo/types';

type AuthSessionDto = AuthSessionView['session'];

class SessionUserDto implements AuthSessionUser {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  email!: string | null;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ nullable: true, example: 'dev' })
  provider!: IdentityProvider | null;
}

class SessionDto implements AuthSessionDto {
  @ApiProperty({ nullable: true })
  id!: string | null;
}

export class AuthSessionResponseDto implements AuthSessionView {
  @ApiProperty({ example: true })
  authenticated!: true;

  @ApiProperty({ type: SessionUserDto })
  user!: SessionUserDto;

  @ApiProperty({ type: SessionDto })
  session!: SessionDto;
}
