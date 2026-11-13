export const MessagingProviderToken = Symbol('MessagingProvider');

export interface OutboundText {
  to: string;
  body: string;
}

export interface OutboundTemplate {
  to: string;
  name: string;
  languageCode: string;
  components?: unknown;
}

export interface OutboundDocument {
  to: string;
  url: string;
  filename: string;
  caption?: string;
}

export interface MessagingProvider {
  readonly name: string;
  sendText(message: OutboundText): Promise<{ messageId: string }>;
  sendTemplate(message: OutboundTemplate): Promise<{ messageId: string }>;
  sendDocument(message: OutboundDocument): Promise<{ messageId: string }>;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
  healthCheck(): Promise<{ ok: boolean; info?: Record<string, unknown> }>;
}
