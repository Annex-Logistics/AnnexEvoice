import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../../common/types.js';

import { PublicApiService } from './public-api.service.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly service: PublicApiService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    const header = req.header('x-api-key');
    if (!header) throw new UnauthorizedException('API key required');
    const tenantId = await this.service.resolveTenantByKey(header);
    if (!tenantId) throw new UnauthorizedException('Invalid API key');
    req.user = { userId: 'public-api', tenantId, role: 'STAFF' };
    return true;
  }
}
