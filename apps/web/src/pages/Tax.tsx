import { useQuery } from '@tanstack/react-query';

import { apiGet, formatNaira } from '../lib/api';

type Summary = { vatKobo: string; whtKobo: string; totalKobo: string; invoiceCount: number };

export function TaxPage() {
  const summary = useQuery({
    queryKey: ['tax', 'summary'],
    queryFn: () => apiGet<Summary>('/tax/summary'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Tax summary — this month</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Invoices" value={summary.data?.invoiceCount ?? '—'} />
        <Card label="VAT" value={summary.data ? formatNaira(summary.data.vatKobo) : '—'} />
        <Card label="WHT" value={summary.data ? formatNaira(summary.data.whtKobo) : '—'} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
