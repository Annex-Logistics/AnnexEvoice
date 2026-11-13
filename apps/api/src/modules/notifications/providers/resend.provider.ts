import { Injectable, NotImplementedException } from '@nestjs/common';

import type { EmailMessage, EmailProvider } from './email.provider.js';

/**
 * Resend adapter stub.
 * TODO(resend): implement against Resend's /emails endpoint.
 */
@Injectable()
export class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  async send(_message: EmailMessage): Promise<{ messageId: string }> {
    throw new NotImplementedException('Resend adapter not implemented.');
  }
  async healthCheck() {
    return { ok: false };
  }
}
