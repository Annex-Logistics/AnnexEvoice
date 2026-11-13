import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

import type { AuthenticatedRequest, AuthenticatedUser, Role } from './types.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export const CurrentUser = createParamDecorator((_data, ctx: ExecutionContext): AuthenticatedUser => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return req.user;
});

export const TenantId = createParamDecorator((_data, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return req.user.tenantId;
});
