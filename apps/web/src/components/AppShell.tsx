import { Link, Outlet } from '@tanstack/react-router';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/customers', label: 'Customers' },
  { to: '/products', label: 'Products' },
  { to: '/tax', label: 'Tax' },
  { to: '/settings', label: 'Settings' },
];

export function AppShell() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-brand">AnnexEvoice</Link>
          <nav className="hidden gap-4 text-sm sm:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="text-slate-600 hover:text-slate-900">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
