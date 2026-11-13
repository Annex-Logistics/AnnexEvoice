import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import type {
  MessagingProvider,
  OutboundDocument,
  OutboundTemplate,
  OutboundText,
} from './messaging.provider.js';

@Injectable()
export class MockWhatsappProvider implements MessagingProvider {
  readonly name = 'mock';
  private readonly logger = new Logger(MockWhatsappProvider.name);

  async sendText(m: OutboundText) {
    this.logger.log(`[MOCK-WA] text → ${m.to}: ${m.body.slice(0, 120)}`);
    return { messageId: randomUUID() };
  }

  async sendTemplate(m: OutboundTemplate) {
    this.logger.log(`[MOCK-WA] template ${m.name} → ${m.to}`);
    return { messageId: randomUUID() };
  }

  async sendDocument(m: OutboundDocument) {
    this.logger.log(`[MOCK-WA] doc "${m.filename}" → ${m.to}`);
    return { messageId: randomUUID() };
  }

  verifyWebhookSignature() {
    return true;
  }

  async healthCheck() {
    return { ok: true, info: { kind: 'mock' } };
  }
}
