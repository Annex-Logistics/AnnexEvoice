import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ALGO = 'aes-256-gcm';

@Injectable()
export class EncryptionService {
  private key: Buffer;

  constructor(config: ConfigService) {
    const b64 = config.get<string>('PII_ENCRYPTION_KEY') ?? process.env.PII_ENCRYPTION_KEY ?? '';
    const raw = Buffer.from(b64, 'base64');
    if (raw.length !== 32) {
      throw new Error('PII_ENCRYPTION_KEY must decode to 32 bytes (base64)');
    }
    this.key = raw;
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGO, this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  decrypt(payload: string): string {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv(ALGO, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
