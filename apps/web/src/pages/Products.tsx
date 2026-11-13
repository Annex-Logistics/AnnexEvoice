import { useQuery } from '@tanstack/react-query';

import { api, formatNaira } from '../lib/api.js';

export function ProductsPage() {
  const products = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.GET('/products' as never, {} as never);
      return (data as Array<{ id: string; name: string; sku: string | null; unitPriceKobo: string }> | undefined) ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Unit price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(products.data ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.sku ?? '—'}</td>
                <td className="px-4 py-2">{formatNaira(p.unitPriceKobo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
