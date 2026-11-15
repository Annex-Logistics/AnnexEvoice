import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

import { CurrentUser, TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';
import { CustomerResponse } from '../../common/openapi-responses.js';
import type { AuthenticatedUser } from '../../common/types.js';

import { CustomersService } from './customers.service.js';

class CreateCustomerDto {
  @IsString() @MaxLength(200) name!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() tin?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsBoolean() isVatRegistered?: boolean;
}

class UpdateCustomerDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() tin?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsBoolean() isVatRegistered?: boolean;
}

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOkResponse({ type: [CustomerResponse] })
  list(@TenantId() tenantId: string) {
    return this.customers.list(tenantId);
  }

  @Get(':id')
  @ApiOkResponse({ type: CustomerResponse })
  get(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.customers.get(tenantId, id);
  }

  @Post()
  @ApiCreatedResponse({ type: CustomerResponse })
  create(@TenantId() tenantId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: CreateCustomerDto) {
    return this.customers.create(tenantId, user.userId, body);
  }

  @Patch(':id')
  @ApiOkResponse({ type: CustomerResponse })
  update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateCustomerDto,
  ) {
    return this.customers.update(tenantId, user.userId, id, body);
  }
}
