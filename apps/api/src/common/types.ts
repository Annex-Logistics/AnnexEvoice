import type { Request } from 'express';

export type Role = 'OWNER' | 'STAFF' | 'ACCOUNTANT' | 'ADMIN';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
