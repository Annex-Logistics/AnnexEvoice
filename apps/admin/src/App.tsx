import { createAnnexEvoiceClient } from '@annexevoice/api-client';
import { useQuery } from '@tanstack/react-query';

const api = createAnnexEvoiceClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  getAccessToken: () => localStorage.getItem('access_token') ?? undefined,
});

export function AdminApp() {
  const tenants = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: async () => {
      const { data } = await api.GET('/v1/admin/tenants');
      return (data as unknown as Array<{ id: string; legalName: string; tin: string | null }> | undefined) ?? [];
    },
  });

  const dlq = useQuery({
    queryKey: ['admin', 'submissions', 'dlq'],
    queryFn: async () => {
      const { data } = await api.GET('/v1/admin/submissions/dlq');
      return (data as unknown as Array<{ id: string; status: string }> | undefined) ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">AnnexEvoice — Admin</h1>
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium">Tenants</h2>
        <ul className="divide-y rounded-lg border border-slate-200 bg-white">
          {(tenants.data ?? []).map((t) => (
            <li key={t.id} className="flex justify-between px-4 py-2 text-sm">
              <span>{t.legalName}</span>
              <span className="text-slate-500">{t.tin ?? 'no TIN'}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-medium">NRS submissions — DLQ / failed</h2>
        <ul className="divide-y rounded-lg border border-slate-200 bg-white">
          {(dlq.data ?? []).map((s) => (
            <li key={s.id} className="flex justify-between px-4 py-2 text-sm">
              <span>{s.id}</span>
              <span className="text-red-600">{s.status}</span>
            </li>
          ))}
          {dlq.data?.length === 0 && <li className="px-4 py-4 text-center text-sm text-slate-500">All clear.</li>}
        </ul>
      </section>
    </div>
  );
}
