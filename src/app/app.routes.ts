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
    path: 'clients/:id',
    title: 'Detail Client',
    loadComponent: () =>
      import('./features/clients/pages/client-detail/client-detail.component').then(
        (m) => m.ClientDetailComponent
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
] satisfies Routes;

