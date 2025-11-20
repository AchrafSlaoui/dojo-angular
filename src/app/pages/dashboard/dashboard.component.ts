import { Component, ChangeDetectionStrategy, Signal, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientCardComponent } from '@app/components/client-card/client-card.component';
import { Client } from '@app/models/client';
import { ClientsApiService } from '@app/services/clients-api.service';
import { getWeeklyClients } from '@app/utils/clients-collection.util';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly clientsApi = inject(ClientsApiService);
  private readonly clientsState = signal<Client[]>([]);
  readonly search = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  weeklyClients: Signal<Client[]> = computed(() => getWeeklyClients(this.clientsState(), this.search()));

  constructor() {
    this.loadClients();
  }

  setSearch(term: string): void {
    this.search.set(term ?? '');
  }

  private async loadClients(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.clientsApi.getAll());
      this.clientsState.set(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les clients.';
      this.error.set(message);
      this.clientsState.set([]);
    } finally {
      this.loading.set(false);
    }
  }
  
  trackByClientId(index: number, client: Client): string {
    return client.id;
  }
}
