import { forwardRef, Module } from '@nestjs/common';
import { LegalController } from './infrastructure/legal.controller';
import { LegalService } from './application/legal.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ILegalRepository } from './domain/repositories/legal.repository';
import { MongooseLegalRepository } from './infrastructure/persistence/mongoose-legal.repository';
import { IConsentRepository } from './domain/repositories/consent.repository';
import { MongooseConsentRepository } from './infrastructure/persistence/mongoose-consent.repository';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    UsersModule,
  ],
  controllers: [LegalController],
  providers: [
    LegalService,
    {
      provide: ILegalRepository,
      useClass: MongooseLegalRepository,
    },
    {
      provide: IConsentRepository,
      useClass: MongooseConsentRepository,
    },
  ],
  exports: [LegalService],
})
export class LegalModule {}
