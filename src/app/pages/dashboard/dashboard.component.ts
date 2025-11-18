import { Component, ChangeDetectionStrategy, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientsStore } from '@app/stores/clients.store';
import { Client } from '@app/models/client';
import { ClientCardComponent } from '@app/components/client-card/client-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  // Search and filtering handled by store
  readonly store = inject(ClientsStore);
  weeklyClients: Signal<Client[]> = this.store.weeklyFilteredClients;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  constructor() {}
  
  trackByClientId(index: number, client: Client): string {
    return client.id;
  }
}
