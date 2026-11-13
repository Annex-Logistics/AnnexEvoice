import { Injectable, NotImplementedException } from '@nestjs/common';

import type { SmsMessage, SmsProvider } from './sms.provider.js';

/**
 * Termii adapter stub.
 * TODO(termii): implement against Termii's documented /api/sms/send endpoint.
 */
@Injectable()
export class TermiiProvider implements SmsProvider {
  readonly name = 'termii';
  async send(_message: SmsMessage): Promise<{ messageId: string }> {
    throw new NotImplementedException('Termii adapter not implemented.');
  }
  async healthCheck() {
    return { ok: false };
  }
}
