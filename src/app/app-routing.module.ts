import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientDetailComponent } from './pages/client-detail/client-detail.component';
import { ClientsComponent } from './pages/clients/clients.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', title: 'Dashboard', component: DashboardComponent },
  { path: 'clients', title: 'Clients', component: ClientsComponent },
  { path: 'clients/:id', title: 'Détail Client', component: ClientDetailComponent },
  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    DashboardComponent,
    ClientsComponent,
    ClientDetailComponent,
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
