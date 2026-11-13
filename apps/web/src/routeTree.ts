import { Outlet, createRootRoute, createRoute } from '@tanstack/react-router';

import { AppShell } from './components/AppShell.js';
import { DashboardPage } from './pages/Dashboard.js';
import { InvoiceDetailPage } from './pages/InvoiceDetail.js';
import { InvoicesPage } from './pages/Invoices.js';
import { LoginPage } from './pages/Login.js';
import { CustomersPage } from './pages/Customers.js';
import { ProductsPage } from './pages/Products.js';
import { TaxPage } from './pages/Tax.js';
import { SettingsPage } from './pages/Settings.js';

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage });

const shellRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: AppShell });

const dashboardRoute = createRoute({ getParentRoute: () => shellRoute, path: '/', component: DashboardPage });
const invoicesRoute = createRoute({ getParentRoute: () => shellRoute, path: 'invoices', component: InvoicesPage });
const invoiceDetailRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: 'invoices/$id',
  component: InvoiceDetailPage,
});
const customersRoute = createRoute({ getParentRoute: () => shellRoute, path: 'customers', component: CustomersPage });
const productsRoute = createRoute({ getParentRoute: () => shellRoute, path: 'products', component: ProductsPage });
const taxRoute = createRoute({ getParentRoute: () => shellRoute, path: 'tax', component: TaxPage });
const settingsRoute = createRoute({ getParentRoute: () => shellRoute, path: 'settings', component: SettingsPage });

export const routeTree = rootRoute.addChildren([
  loginRoute,
  shellRoute.addChildren([
    dashboardRoute,
    invoicesRoute,
    invoiceDetailRoute,
    customersRoute,
    productsRoute,
    taxRoute,
    settingsRoute,
  ]),
]);
