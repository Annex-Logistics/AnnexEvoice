import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmailProviderToken } from './providers/email.provider.js';
import { MockEmailProvider } from './providers/mock-email.provider.js';
import { MockSmsProvider } from './providers/mock-sms.provider.js';
import { ResendProvider } from './providers/resend.provider.js';
import { SmsProviderToken } from './providers/sms.provider.js';
import { TermiiProvider } from './providers/termii.provider.js';

@Module({
  imports: [BullModule.registerQueue({ name: 'notifications' })],
  providers: [
    MockSmsProvider,
    MockEmailProvider,
    TermiiProvider,
    ResendProvider,
    {
      provide: SmsProviderToken,
      inject: [ConfigService, MockSmsProvider, TermiiProvider],
      useFactory: (config: ConfigService, mock: MockSmsProvider, termii: TermiiProvider) => {
        const kind = config.get<string>('providers.sms') ?? process.env.SMS_PROVIDER ?? 'mock';
        return kind === 'termii' ? termii : mock;
      },
    },
    {
      provide: EmailProviderToken,
      inject: [ConfigService, MockEmailProvider, ResendProvider],
      useFactory: (config: ConfigService, mock: MockEmailProvider, resend: ResendProvider) => {
        const kind = config.get<string>('providers.email') ?? process.env.EMAIL_PROVIDER ?? 'mock';
        return kind === 'resend' ? resend : mock;
      },
    },
  ],
  exports: [SmsProviderToken, EmailProviderToken],
})
export class NotificationsModule {}
