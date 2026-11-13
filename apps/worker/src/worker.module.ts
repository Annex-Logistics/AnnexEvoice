import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';

import { PrismaService } from './prisma.service.js';
import { EInvoiceReconcileProcessor } from './processors/einvoice-reconcile.processor.js';
import { EInvoiceSubmitProcessor } from './processors/einvoice-submit.processor.js';
import { NotificationsProcessor } from './processors/notifications.processor.js';
import { PaymentReconcileProcessor } from './processors/payment-reconcile.processor.js';
import { PdfRenderProcessor } from './processors/pdf-render.processor.js';
import { RemindersProcessor } from './processors/reminders.processor.js';
import { WhatsappInboundProcessor } from './processors/whatsapp-inbound.processor.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.forRoot({ connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' } }),
    BullModule.registerQueue(
      { name: 'einvoice-submit' },
      { name: 'einvoice-reconcile' },
      { name: 'whatsapp-inbound' },
      { name: 'whatsapp-outbound' },
      { name: 'pdf-render' },
      { name: 'notifications' },
      { name: 'reminders' },
      { name: 'payment-reconcile' },
    ),
  ],
  providers: [
    PrismaService,
    EInvoiceSubmitProcessor,
    EInvoiceReconcileProcessor,
    WhatsappInboundProcessor,
    PdfRenderProcessor,
    NotificationsProcessor,
    RemindersProcessor,
    PaymentReconcileProcessor,
  ],
})
export class WorkerModule {}
