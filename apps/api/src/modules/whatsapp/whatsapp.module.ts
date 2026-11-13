import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MessagingProviderToken } from './providers/messaging.provider.js';
import { MetaWhatsappProvider } from './providers/meta.provider.js';
import { MockWhatsappProvider } from './providers/mock.provider.js';
import { WhatsappController } from './whatsapp.controller.js';
import { WhatsappService } from './whatsapp.service.js';

@Module({
  imports: [BullModule.registerQueue({ name: 'whatsapp-inbound' }, { name: 'whatsapp-outbound' })],
  controllers: [WhatsappController],
  providers: [
    WhatsappService,
    MockWhatsappProvider,
    MetaWhatsappProvider,
    {
      provide: MessagingProviderToken,
      inject: [ConfigService, MockWhatsappProvider, MetaWhatsappProvider],
      useFactory: (config: ConfigService, mock: MockWhatsappProvider, meta: MetaWhatsappProvider) => {
        const kind = config.get<string>('providers.whatsapp') ?? process.env.WHATSAPP_PROVIDER ?? 'mock';
        return kind === 'meta' ? meta : mock;
      },
    },
  ],
  exports: [WhatsappService, MessagingProviderToken],
})
export class WhatsappModule {}
