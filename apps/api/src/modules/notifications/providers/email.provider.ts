export const EmailProviderToken = Symbol('EmailProvider');

export interface EmailMessage {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; url?: string; contentBase64?: string }>;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<{ messageId: string }>;
  healthCheck(): Promise<{ ok: boolean }>;
}
