import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PaystackProvider } from './providers/paystack.provider.js';
import { FlutterwaveProvider } from './providers/flutterwave.provider.js';
import { MockPaymentProvider } from './providers/mock.provider.js';
import { PaymentProviderToken } from './providers/payment.provider.js';
import { WebhooksController } from './webhooks.controller.js';

@Module({
  imports: [BullModule.registerQueue({ name: 'payment-reconcile' })],
  controllers: [PaymentsController, WebhooksController],
  providers: [
    PaymentsService,
    MockPaymentProvider,
    PaystackProvider,
    FlutterwaveProvider,
    {
      provide: PaymentProviderToken,
      inject: [ConfigService, MockPaymentProvider, PaystackProvider, FlutterwaveProvider],
      useFactory: (
        config: ConfigService,
        mock: MockPaymentProvider,
        paystack: PaystackProvider,
        flutter: FlutterwaveProvider,
      ) => {
        const kind = config.get<string>('providers.payment') ?? process.env.PAYMENT_PROVIDER ?? 'mock';
        if (kind === 'paystack') return paystack;
        if (kind === 'flutterwave') return flutter;
        return mock;
      },
    },
  ],
  exports: [PaymentsService, PaymentProviderToken],
})
export class PaymentsModule {}
