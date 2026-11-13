import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  MessagingProvider,
  OutboundDocument,
  OutboundTemplate,
  OutboundText,
} from './messaging.provider.js';

/**
 * Meta WhatsApp Cloud API adapter.
 * Documented endpoints only:
 *   POST https://graph.facebook.com/v22.0/{phone_number_id}/messages
 * Signature verification: SHA-256 HMAC with app secret over the raw body, header x-hub-signature-256
 * (format "sha256=<hex>"). See Meta docs — do not guess.
 */
@Injectable()
export class MetaWhatsappProvider implements MessagingProvider {
  readonly name = 'meta';
  private readonly logger = new Logger(MetaWhatsappProvider.name);
  private readonly token: string;
  private readonly phoneNumberId: string;
  private readonly appSecret: string;
  private readonly base = 'https://graph.facebook.com/v22.0';

  constructor(config: ConfigService) {
    this.token = config.get<string>('whatsapp.accessToken') ?? '';
    this.phoneNumberId = config.get<string>('whatsapp.phoneNumberId') ?? '';
    this.appSecret = config.get<string>('whatsapp.appSecret') ?? '';
  }

  async sendText(m: OutboundText) {
    return this.post({ messaging_product: 'whatsapp', to: m.to, type: 'text', text: { body: m.body } });
  }

  async sendTemplate(m: OutboundTemplate) {
    return this.post({
      messaging_product: 'whatsapp',
      to: m.to,
      type: 'template',
      template: { name: m.name, language: { code: m.languageCode }, components: m.components },
    });
  }

  async sendDocument(m: OutboundDocument) {
    return this.post({
      messaging_product: 'whatsapp',
      to: m.to,
      type: 'document',
      document: { link: m.url, filename: m.filename, caption: m.caption },
    });
  }

  private async post(body: unknown): Promise<{ messageId: string }> {
    if (!this.token || !this.phoneNumberId) throw new Error('WhatsApp credentials missing');
    const res = await fetch(`${this.base}/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`WhatsApp send failed: ${res.status} ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as { messages?: { id: string }[] };
    return { messageId: data.messages?.[0]?.id ?? 'unknown' };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    if (!this.appSecret || !signature) return false;
    const [scheme, hex] = signature.split('=');
    if (scheme !== 'sha256' || !hex) return false;
    const expected = createHmac('sha256', this.appSecret).update(rawBody).digest();
    const got = Buffer.from(hex, 'hex');
    if (expected.length !== got.length) return false;
    return timingSafeEqual(expected, got);
  }

  async healthCheck() {
    return { ok: Boolean(this.token && this.phoneNumberId), info: { kind: 'meta' } };
  }
}
