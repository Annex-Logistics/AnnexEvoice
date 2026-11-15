import { createAnnexEvoiceClient, type components } from '@annexevoice/api-client';

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const api = createAnnexEvoiceClient({
  baseUrl,
  credentials: 'include',
  getAccessToken: () => localStorage.getItem('access_token'),
});

export type Schemas = components['schemas'];

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`API request failed: ${status}`);
  }
}

// openapi-fetch resolves (never rejects) on HTTP errors; TanStack Query needs a throw.
export async function unwrap<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await call;
  if (!response.ok || data === undefined) throw new ApiError(response.status, error);
  return data;
}

export function formatNaira(kobo: string | number | bigint): string {
  const k = typeof kobo === 'bigint' ? kobo : BigInt(kobo);
  const naira = Number(k) / 100;
  return naira.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
}
