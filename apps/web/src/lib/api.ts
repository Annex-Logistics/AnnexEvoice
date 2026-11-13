const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: authHeader(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeader() },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  return token ? { authorization: `Bearer ${token}` } : {};
}

export function formatNaira(kobo: string | number | bigint): string {
  const k = typeof kobo === 'bigint' ? kobo : BigInt(kobo);
  const naira = Number(k) / 100;
  return naira.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
}
