import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service.js';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateWithPassword(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });
    if (!user || !user.hashedPassword) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async findOrCreateUserByPhone(phone: string) {
    return this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });
  }

  async primaryMembership(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) throw new UnauthorizedException('No tenant membership');
    return membership;
  }

  async issueTokens(userId: string, tenantId: string, role: string): Promise<IssuedTokens> {
    const payload = { sub: userId, tenantId, role };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(
      { ...payload, typ: 'refresh' },
      {
        secret: this.config.get<string>('jwt.refreshSecret') ?? process.env.JWT_REFRESH_SECRET,
        expiresIn: `${this.config.get<number>('jwt.refreshTtl') ?? 2_592_000}s`,
      },
    );
    return { accessToken, refreshToken };
  }

  async rotateRefresh(refreshToken: string): Promise<IssuedTokens> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; tenantId: string; role: string; typ: string }>(
        refreshToken,
        { secret: this.config.get<string>('jwt.refreshSecret') ?? process.env.JWT_REFRESH_SECRET },
      );
      if (payload.typ !== 'refresh') throw new UnauthorizedException();
      return this.issueTokens(payload.sub, payload.tenantId, payload.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
