import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../lib/api';

type Customer = { id: string; name: string; phone: string | null; email: string | null };

export function CustomersPage() {
  const customers = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiGet<Customer[]>('/customers'),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(customers.data ?? []).map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.phone ?? '—'}</td>
                <td className="px-4 py-2">{c.email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
