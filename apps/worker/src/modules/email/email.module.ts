import { Module } from '@nestjs/common';
import { EmailProcessor } from './processors/email.processor';

@Module({
  providers: [EmailProcessor],
})
export class EmailModule {}
