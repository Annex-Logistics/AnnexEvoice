import { useQuery } from '@tanstack/react-query';

import { apiGet, formatNaira } from '../lib/api';

type Summary = { invoiceCount: number; vatKobo: string; whtKobo: string; totalKobo: string };

export function DashboardPage() {
  const summary = useQuery({
    queryKey: ['tax', 'summary'],
    queryFn: () => apiGet<Summary>('/tax/summary'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Invoices this month" value={summary.data?.invoiceCount ?? '—'} />
        <Stat label="VAT collected" value={summary.data ? formatNaira(summary.data.vatKobo) : '—'} />
        <Stat label="Total billed" value={summary.data ? formatNaira(summary.data.totalKobo) : '—'} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
