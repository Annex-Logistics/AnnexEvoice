export const SmsProviderToken = Symbol('SmsProvider');

export interface SmsMessage {
  to: string;
  body: string;
}

export interface SmsProvider {
  readonly name: string;
  send(message: SmsMessage): Promise<{ messageId: string }>;
  healthCheck(): Promise<{ ok: boolean }>;
}
