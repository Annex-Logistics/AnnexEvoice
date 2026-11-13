import { Module } from '@nestjs/common';

import { InvoicesModule } from '../invoices/invoices.module.js';

import { PublicApiController } from './public-api.controller.js';
import { PublicApiService } from './public-api.service.js';
import { ApiKeyGuard } from './api-key.guard.js';

@Module({
  imports: [InvoicesModule],
  controllers: [PublicApiController],
  providers: [PublicApiService, ApiKeyGuard],
})
export class PublicApiModule {}
