import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import type { EmailMessage, EmailProvider } from './email.provider.js';

@Injectable()
export class MockEmailProvider implements EmailProvider {
  readonly name = 'mock';
  private readonly logger = new Logger(MockEmailProvider.name);

  async send(message: EmailMessage) {
    this.logger.log(`[MOCK-EMAIL] → ${message.to}: ${message.subject}`);
    return { messageId: randomUUID() };
  }

  async healthCheck() {
    return { ok: true };
  }
}
