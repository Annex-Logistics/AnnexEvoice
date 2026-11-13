import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { apiGet, formatNaira } from '../lib/api';

type Invoice = {
  id: string;
  number: string | null;
  status: string;
  totalKobo: string;
  vatKobo: string;
  subtotalKobo: string;
  customer: { name: string };
  lines: Array<{ id: string; description: string; quantity: number; unitPriceKobo: string; lineTotalKobo: string }>;
  irn: string | null;
};

export function InvoiceDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const invoice = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => apiGet<Invoice>(`/invoices/${id}`),
  });

  if (!invoice.data) return <p>Loading…</p>;
  const inv = invoice.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Invoice {inv.number ?? '(draft)'}</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex justify-between text-sm">
          <div>
            <div className="font-medium">{inv.customer.name}</div>
            <div className="text-slate-500">Status: {inv.status}</div>
            {inv.irn && <div className="text-slate-500">IRN: {inv.irn}</div>}
          </div>
          <div className="text-right text-lg font-semibold">{formatNaira(inv.totalKobo)}</div>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Description</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Unit</th>
              <th className="py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.id}>
                <td className="py-2">{l.description}</td>
                <td className="py-2">{l.quantity}</td>
                <td className="py-2">{formatNaira(l.unitPriceKobo)}</td>
                <td className="py-2">{formatNaira(l.lineTotalKobo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
