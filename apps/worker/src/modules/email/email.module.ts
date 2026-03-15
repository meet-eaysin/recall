import { Module, InternalServerErrorException } from '@nestjs/common';
import { EmailController } from './processors/email.controller';
import { EmailService } from './email.service';
import {
  EMAIL_PROVIDER_TOKEN,
  EmailProvider,
} from './providers/email-provider';
import { ResendEmailProvider } from './providers/resend-email.provider';
import { env } from '../../shared/utils/env';

@Module({
  controllers: [EmailController],
  providers: [
    EmailService,
    ResendEmailProvider,
    {
      provide: EMAIL_PROVIDER_TOKEN,
      inject: [ResendEmailProvider],
      useFactory: (resendProvider: ResendEmailProvider): EmailProvider => {
        if (env.EMAIL_PROVIDER === 'resend') {
          return resendProvider;
        }
        throw new InternalServerErrorException(
          `Unsupported email provider: ${env.EMAIL_PROVIDER}`,
        );
      },
    },
  ],
})
export class EmailModule {}
