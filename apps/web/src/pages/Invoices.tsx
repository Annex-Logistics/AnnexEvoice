import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { api, formatNaira } from '../lib/api.js';

type InvoiceRow = {
  id: string;
  number: string | null;
  status: string;
  totalKobo: string;
  customer: { name: string };
  issuedAt: string | null;
};

export function InvoicesPage() {
  const invoices = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data } = await api.GET('/invoices' as never, {} as never);
      return (data as InvoiceRow[] | undefined) ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
        <Link to="/invoices" className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
          New
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Number</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Issued</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(invoices.data ?? []).map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">
                  <Link to="/invoices/$id" params={{ id: inv.id }} className="text-brand hover:underline">
                    {inv.number ?? 'draft'}
                  </Link>
                </td>
                <td className="px-4 py-2">{inv.customer.name}</td>
                <td className="px-4 py-2">{inv.status}</td>
                <td className="px-4 py-2">{formatNaira(inv.totalKobo)}</td>
                <td className="px-4 py-2">{inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {invoices.data?.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
