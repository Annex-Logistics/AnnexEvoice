import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import type { SmsMessage, SmsProvider } from './sms.provider.js';

@Injectable()
export class MockSmsProvider implements SmsProvider {
  readonly name = 'mock';
  private readonly logger = new Logger(MockSmsProvider.name);

  async send(message: SmsMessage) {
    this.logger.log(`[MOCK-SMS] → ${message.to}: ${message.body.slice(0, 80)}`);
    return { messageId: randomUUID() };
  }

  async healthCheck() {
    return { ok: true };
  }
}
