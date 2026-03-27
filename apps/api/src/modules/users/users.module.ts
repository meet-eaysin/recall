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
import { UpdateUserUseCase } from './application/use-cases/update-user.usecase';
import { DeleteAccountUseCase } from './application/use-cases/delete-account.usecase';
import { AuthModule } from '../auth/auth.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { NotionModule } from '../notion/notion.module';
import { GraphModule } from '../graph/graph.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    KnowledgeModule,
    NotionModule,
    GraphModule,
  ],
  controllers: [UsersController, UserLlmSettingsController],
  providers: [
    GetMeUseCase,
    EnsureDevUserUseCase,
    UpsertUserFromIdentityUseCase,
    ListUserSessionsUseCase,
    RevokeUserSessionUseCase,
    UpdateUserUseCase,
    DeleteAccountUseCase,
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
    UpdateUserUseCase,
    DeleteAccountUseCase,
  ],
})
export class UsersModule {}
