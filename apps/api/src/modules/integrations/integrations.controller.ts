import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsObject } from 'class-validator';

import { TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';

import { IntegrationsService, SUPPORTED_PROVIDERS } from './integrations.service.js';

class ConnectDto {
  @IsIn(SUPPORTED_PROVIDERS) provider!: string;
  @IsObject() config!: Record<string, unknown>;
}

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.integrations.list(tenantId);
  }

  @Post()
  connect(@TenantId() tenantId: string, @Body() body: ConnectDto) {
    return this.integrations.upsert(tenantId, body.provider, body.config);
  }

  @Delete(':provider')
  disconnect(@TenantId() tenantId: string, @Param('provider') provider: string) {
    return this.integrations.disconnect(tenantId, provider);
  }
}
