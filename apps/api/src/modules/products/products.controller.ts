import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { CurrentUser, TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';
import type { AuthenticatedUser } from '../../common/types.js';

import { ProductsService } from './products.service.js';

class CreateProductDto {
  @IsString() name!: string;
  @IsOptional() @IsString() sku?: string;
  @IsInt() @Min(0) unitPriceKobo!: number;
  @IsOptional() @IsUUID() taxRuleId?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsInt() @Min(0) unitPriceKobo?: number;
  @IsOptional() @IsUUID() taxRuleId?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.products.list(tenantId);
  }

  @Get(':id')
  get(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.products.get(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: CreateProductDto) {
    return this.products.create(tenantId, user.userId, { ...body, unitPriceKobo: BigInt(body.unitPriceKobo) });
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ) {
    const { unitPriceKobo, ...rest } = body;
    const patch: { name?: string; sku?: string; unitPriceKobo?: bigint; taxRuleId?: string; active?: boolean } = rest;
    if (unitPriceKobo !== undefined) patch.unitPriceKobo = BigInt(unitPriceKobo);
    return this.products.update(tenantId, user.userId, id, patch);
  }
}
