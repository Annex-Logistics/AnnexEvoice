import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  live() {
    return { status: 'ok', uptime: process.uptime(), ts: new Date().toISOString() };
  }

  @Get('ready')
  @Public()
  async ready() {
    const checks: Record<string, string> = { api: 'ok' };
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.db = 'ok';
    } catch {
      checks.db = 'fail';
    }
    const ok = Object.values(checks).every((v) => v === 'ok');
    return { status: ok ? 'ok' : 'degraded', checks };
  }
}
