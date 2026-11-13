import createClient from 'openapi-fetch';

import type { paths } from './generated/schema.js';

export type AnnexEvoiceClient = ReturnType<typeof createClient<paths>>;

export interface ClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null | undefined;
}

export function createAnnexEvoiceClient(options: ClientOptions): AnnexEvoiceClient {
  const client = createClient<paths>({ baseUrl: options.baseUrl });
  if (options.getAccessToken) {
    client.use({
      onRequest({ request }) {
        const token = options.getAccessToken?.();
        if (token) request.headers.set('authorization', `Bearer ${token}`);
        return request;
      },
    });
  }
  return client;
}

export type { paths, components } from './generated/schema.js';
