import { Routes } from '@angular/router';

export const routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Dashboard',
    loadComponent: () =>
      import('./features/clients/pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'clients',
    title: 'Clients',
    loadComponent: () =>
      import('./features/clients/pages/clients/clients.component').then(
        (m) => m.ClientsComponent
      ),
  },
  {
    path: 'clients/:clientId/accounts/:accountId',
    title: 'Detail Compte',
    loadComponent: () =>
      import('./features/accounts/pages/account-detail/account-detail.component').then(
        (m) => m.AccountDetailComponent
      ),
  },
  {
    path: 'clients/:id/accounts',
    title: 'Comptes Client',
    loadComponent: () =>
      import('./features/accounts/pages/accounts/accounts.component').then(
        (m) => m.AccountsComponent
      ),
  },
  {
    path: 'clients/:id',
    title: 'Detail Client',
    loadComponent: () =>
      import('./features/clients/pages/client-detail/client-detail.component').then(
        (m) => m.ClientDetailComponent
      ),
  },
  {
    path: 'signals-demo',
    title: 'Signals Demo',
    loadComponent: () =>
      import('./features/signals-demo/signals-demo.component').then(
        (m) => m.SignalsDemoComponent
      ),
  },
  {
    path: 'primitive-lab',
    title: 'Primitive Lab',
    loadComponent: () =>
      import('./features/primitive-lab/primitive-lab.component').then(
        (m) => m.PrimitiveLabComponent
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
] satisfies Routes;

