import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EInvoiceController } from './einvoice.controller.js';
import { EInvoiceService } from './einvoice.service.js';
import { EInvoiceProviderToken } from './providers/einvoice.provider.js';
import { ApprovedApProvider } from './providers/approved-ap.provider.js';
import { MockEInvoiceProvider } from './providers/mock.provider.js';

@Module({
  imports: [BullModule.registerQueue({ name: 'einvoice-submit' }, { name: 'einvoice-reconcile' })],
  controllers: [EInvoiceController],
  providers: [
    EInvoiceService,
    MockEInvoiceProvider,
    ApprovedApProvider,
    {
      provide: EInvoiceProviderToken,
      inject: [ConfigService, MockEInvoiceProvider, ApprovedApProvider],
      useFactory: (config: ConfigService, mock: MockEInvoiceProvider, real: ApprovedApProvider) => {
        const kind = config.get<string>('providers.einvoice') ?? process.env.EINVOICE_PROVIDER ?? 'mock';
        return kind === 'mock' ? mock : real;
      },
    },
  ],
  exports: [EInvoiceService, EInvoiceProviderToken],
})
export class EInvoiceModule {}
