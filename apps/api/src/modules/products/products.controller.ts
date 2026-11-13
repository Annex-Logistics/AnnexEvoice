import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { CurrentUser, TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';
import type { AuthenticatedUser } from '../../common/types.js';

import { ProductsService } from './products.service.js';

class CreateProductDto {
  @IsString() name!: string;
  @IsOptional() @IsString() sku?: string;
  @IsInt() @Min(0) @Transform(({ value }) => BigInt(value), { toClassOnly: true })
  unitPriceKobo!: bigint;
  @IsOptional() @IsUUID() taxRuleId?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsInt() @Min(0) @Transform(({ value }) => BigInt(value), { toClassOnly: true })
  unitPriceKobo?: bigint;
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
    return this.products.create(tenantId, user.userId, body);
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.products.update(tenantId, user.userId, id, body);
  }
}
