import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AdminModule } from './modules/admin/admin.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { EInvoiceModule } from './modules/einvoice/einvoice.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { IntegrationsModule } from './modules/integrations/integrations.module.js';
import { InvoicesModule } from './modules/invoices/invoices.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { PublicApiModule } from './modules/public-api/public-api.module.js';
import { TaxModule } from './modules/tax/tax.module.js';
import { TenantsModule } from './modules/tenants/tenants.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module.js';
import { loadConfig } from './config/configuration.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [loadConfig] }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.otp',
            'req.body.secret',
            '*.tin',
            '*.phone',
          ],
          remove: true,
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    CustomersModule,
    ProductsModule,
    TaxModule,
    InvoicesModule,
    EInvoiceModule,
    PaymentsModule,
    WhatsappModule,
    NotificationsModule,
    BillingModule,
    IntegrationsModule,
    AuditModule,
    PublicApiModule,
    AdminModule,
  ],
})
export class AppModule {}
