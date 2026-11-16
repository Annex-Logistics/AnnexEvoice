export const StorageProviderToken = Symbol('StorageProvider');

export interface StorageProvider {
  readonly name: string;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  signedReadUrl(key: string, ttlSeconds: number): Promise<string>;
}
