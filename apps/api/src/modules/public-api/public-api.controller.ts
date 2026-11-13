import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

import { CurrentUser, TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';
import type { AuthenticatedUser } from '../../common/types.js';
import { InvoicesService } from '../invoices/invoices.service.js';

import { ApiKeyGuard } from './api-key.guard.js';
import { PublicApiService } from './public-api.service.js';

class IssueKeyDto {
  @IsString() @MaxLength(80) name!: string;
}

/** Owner-facing management of API keys (JWT auth). */
@ApiTags('public-api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly service: PublicApiService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.service.listKeys(tenantId);
  }

  @Post()
  async issue(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: IssueKeyDto,
  ) {
    const issued = await this.service.issueKey(tenantId, user.userId, body.name);
    return { id: issued.id, name: issued.name, plaintext: issued.plaintext };
  }

  @Delete(':id')
  revoke(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.revokeKey(tenantId, id);
  }
}

/** Partner-facing public API (x-api-key auth). */
@ApiTags('public-api')
@UseGuards(ApiKeyGuard)
@Controller({ path: 'public/invoices', version: '1' })
export class PublicApiController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.invoices.list(tenantId);
  }

  @Get(':id')
  get(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.invoices.get(tenantId, id);
  }

  @Post(':id/issue')
  issue(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.invoices.issue(tenantId, null, id);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body()
    body: {
      customerId: string;
      lines: Array<{ description: string; unitPriceKobo: number; quantity: number; taxRuleId?: string }>;
      whtRuleId?: string;
      notes?: string;
    },
  ) {
    return this.invoices.createDraft(tenantId, null, {
      customerId: body.customerId,
      whtRuleId: body.whtRuleId,
      notes: body.notes,
      lines: body.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPriceKobo: BigInt(l.unitPriceKobo),
        taxRuleId: l.taxRuleId,
      })),
    });
  }
}
