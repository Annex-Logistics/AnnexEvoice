import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listForTenant(tenantId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { tenantId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((m) => ({
      userId: m.user.id,
      phone: m.user.phone,
      email: m.user.email,
      role: m.role,
      createdAt: m.createdAt,
    }));
  }
}
