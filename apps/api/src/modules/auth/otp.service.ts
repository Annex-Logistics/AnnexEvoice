import { createHmac, randomInt } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

const OTP_TTL_SECONDS = 300;

@Injectable()
export class OtpService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  }

  async issueOtp(phone: string): Promise<string> {
    const code = String(randomInt(100_000, 999_999));
    const hash = this.hash(phone, code);
    await this.redis.set(`otp:${phone}`, hash, 'EX', OTP_TTL_SECONDS);
    return code;
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`otp:${phone}`);
    if (!stored) return false;
    const given = this.hash(phone, code);
    if (stored !== given) return false;
    await this.redis.del(`otp:${phone}`);
    return true;
  }

  private hash(phone: string, code: string): string {
    const secret = process.env.OTP_HMAC_SECRET ?? process.env.JWT_ACCESS_SECRET ?? 'dev-otp-secret';
    return createHmac('sha256', secret).update(`${phone}:${code}`).digest('hex');
  }
}
