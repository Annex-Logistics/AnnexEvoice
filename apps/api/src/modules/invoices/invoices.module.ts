import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CustomersModule } from '../customers/customers.module.js';
import { TaxModule } from '../tax/tax.module.js';

import { InvoiceNumberService } from './invoice-number.service.js';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesService } from './invoices.service.js';

@Module({
  imports: [TaxModule, CustomersModule, BullModule.registerQueue({ name: 'einvoice-submit' })],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceNumberService],
  exports: [InvoicesService, InvoiceNumberService],
})
export class InvoicesModule {}
