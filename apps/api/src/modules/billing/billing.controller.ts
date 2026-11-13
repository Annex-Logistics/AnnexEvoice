import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';

import { BillingService, PLANS } from './billing.service.js';

class SubscribeDto {
  @IsIn(Object.keys(PLANS)) planCode!: keyof typeof PLANS;
}

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('plans')
  plans() {
    return this.billing.listPlans();
  }

  @Get('subscription')
  subscription(@TenantId() tenantId: string) {
    return this.billing.getSubscription(tenantId);
  }

  @Post('subscribe')
  subscribe(@TenantId() tenantId: string, @Body() body: SubscribeDto) {
    return this.billing.subscribe(tenantId, body.planCode);
  }
}
