import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

import { TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';
import { TenantResponse } from '../../common/openapi-responses.js';

import { TenantsService } from './tenants.service.js';

class UpdateTenantDto {
  @IsOptional() @IsString() @MaxLength(200) tradingName?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsEmail() email?: string;
}

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants/me')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  @ApiOkResponse({ type: TenantResponse })
  me(@TenantId() tenantId: string) {
    return this.tenants.getById(tenantId);
  }

  @Patch()
  @ApiOkResponse({ type: TenantResponse })
  update(@TenantId() tenantId: string, @Body() body: UpdateTenantDto) {
    return this.tenants.update(tenantId, body);
  }
}
