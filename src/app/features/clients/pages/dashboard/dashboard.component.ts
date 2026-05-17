import { Component, ChangeDetectionStrategy, Signal, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientCardComponent } from '@clients/components/client-card/client-card.component';
import { ClientActivity } from '@clients/models/client-activity';
import { ClientsApiService } from '@clients/services/clients-api.service';
import { getWeeklyClients } from '@clients/utils/clients-collection.util';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, ClientCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly clientsApi = inject(ClientsApiService);
  private readonly clientsState = signal<ClientActivity[]>([]);
  readonly search = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  weeklyClients: Signal<ClientActivity[]> = computed(() => getWeeklyClients(this.clientsState(), this.search()));

  constructor() {
    this.reload();
  }

  setSearch(term: string): void {
    this.search.set(term ?? '');
  }

  async reload(): Promise<void> {
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
}
