import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CustomersModule } from '../customers/customers.module.js';
import { TaxModule } from '../tax/tax.module.js';

import { CreditNotesController } from './credit-notes.controller.js';
import { CreditNotesService } from './credit-notes.service.js';
import { InvoiceNumberService } from './invoice-number.service.js';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesService } from './invoices.service.js';

@Module({
  imports: [TaxModule, CustomersModule, BullModule.registerQueue({ name: 'einvoice-submit' })],
  controllers: [InvoicesController, CreditNotesController],
  providers: [InvoicesService, InvoiceNumberService, CreditNotesService],
  exports: [InvoicesService, InvoiceNumberService, CreditNotesService],
})
export class InvoicesModule {}
