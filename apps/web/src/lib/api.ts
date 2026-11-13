import { createAnnexEvoiceClient } from '@annexevoice/api-client';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const api = createAnnexEvoiceClient({
  baseUrl,
  getAccessToken: () => localStorage.getItem('access_token') ?? undefined,
});

export function formatNaira(kobo: string | number | bigint): string {
  const k = typeof kobo === 'bigint' ? kobo : BigInt(kobo);
  const naira = Number(k) / 100;
  return naira.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
}
