import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

import { AdminService } from './admin.service.js';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('tenants')
  tenants() {
    return this.admin.listTenants();
  }

  @Get('submissions/dlq')
  dlq() {
    return this.admin.dlqSubmissions();
  }

  @Get('integrations/health')
  health() {
    return this.admin.integrationHealth();
  }
}
