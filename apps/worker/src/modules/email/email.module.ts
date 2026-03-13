import { Module } from '@nestjs/common';
import { EmailController } from './processors/email.controller';

@Module({
  controllers: [EmailController],
})
export class EmailModule {}
