import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AuthenticatedUser } from '../../common/types.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret') ?? process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    });
  }

  validate(payload: { sub: string; tenantId: string; role: AuthenticatedUser['role'] }): AuthenticatedUser {
    if (!payload?.sub || !payload.tenantId) throw new UnauthorizedException();
    return { userId: payload.sub, tenantId: payload.tenantId, role: payload.role };
  }
}
