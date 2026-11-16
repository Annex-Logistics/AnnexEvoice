import createClient from 'openapi-fetch';

import type { paths } from './generated/schema.js';

export type AnnexEvoiceClient = ReturnType<typeof createClient<paths>>;

export interface ClientOptions {
  /** API origin only, e.g. http://localhost:3000. Paths already carry the /v1 prefix. */
  baseUrl: string;
  getAccessToken?: () => string | null | undefined;
  credentials?: 'include' | 'omit' | 'same-origin';
}

export function createAnnexEvoiceClient(options: ClientOptions): AnnexEvoiceClient {
  const client = createClient<paths>({ baseUrl: options.baseUrl, credentials: options.credentials });
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
