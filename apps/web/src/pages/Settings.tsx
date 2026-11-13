import { useQuery } from '@tanstack/react-query';

import { api } from '../lib/api.js';

export function SettingsPage() {
  const tenant = useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: async () => {
      const { data } = await api.GET('/tenants/me' as never, {} as never);
      return data as { legalName: string; tradingName: string | null; tin: string | null; email: string | null };
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm text-sm">
        <div><strong>Legal name:</strong> {tenant.data?.legalName}</div>
        <div><strong>Trading name:</strong> {tenant.data?.tradingName ?? '—'}</div>
        <div><strong>TIN:</strong> {tenant.data?.tin ?? '—'}</div>
        <div><strong>Email:</strong> {tenant.data?.email ?? '—'}</div>
      </div>
    </div>
  );
}
