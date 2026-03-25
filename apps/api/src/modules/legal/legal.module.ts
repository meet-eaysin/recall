import { Module } from '@nestjs/common';
import { LegalController } from './infrastructure/legal.controller';
import { LegalService } from './application/legal.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ILegalRepository } from './domain/repositories/legal.repository';
import { MongooseLegalRepository } from './infrastructure/persistence/mongoose-legal.repository';

@Module({
  imports: [
    AuthModule,
    UsersModule,
  ],
  controllers: [LegalController],
  providers: [
    LegalService,
    {
      provide: ILegalRepository,
      useClass: MongooseLegalRepository,
    },
  ],
  exports: [LegalService],
})
export class LegalModule {}
