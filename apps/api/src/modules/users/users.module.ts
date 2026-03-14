import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './interface/users.controller';
import { UserLlmSettingsController } from './interface/user-llm-settings.controller';
import { GetMeUseCase } from './application/use-cases/get-me.usecase';
import { UpsertUserFromIdentityUseCase } from './application/use-cases/upsert-user-from-identity.usecase';
import { EnsureDevUserUseCase } from './application/use-cases/ensure-dev-user.usecase';
import { IUserRepository } from './domain/repositories/user.repository';
import { MongooseUserRepository } from './infrastructure/persistence/mongoose-user.repository';
import { ListUserSessionsUseCase } from './application/use-cases/list-user-sessions.usecase';
import { RevokeUserSessionUseCase } from './application/use-cases/revoke-user-session.usecase';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController, UserLlmSettingsController],
  providers: [
    GetMeUseCase,
    EnsureDevUserUseCase,
    UpsertUserFromIdentityUseCase,
    ListUserSessionsUseCase,
    RevokeUserSessionUseCase,
    {
      provide: IUserRepository,
      useClass: MongooseUserRepository,
    },
  ],
  exports: [
    GetMeUseCase,
    EnsureDevUserUseCase,
    UpsertUserFromIdentityUseCase,
    IUserRepository,
    ListUserSessionsUseCase,
    RevokeUserSessionUseCase,
  ],
})
export class UsersModule {}
