import { Component, ChangeDetectionStrategy, Signal, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, firstValueFrom } from 'rxjs';
import { ClientCardComponent } from '@clients/components/client-card/client-card.component';
import { ClientActivity } from '@clients/models/client-activity';
import { ClientsApiService } from '@clients/services/clients-api.service';
import { getWeeklyClients } from '@clients/utils/clients-collection.util';

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
  private readonly route = inject(ActivatedRoute);
  private readonly clientsState = signal<ClientActivity[]>([]);
  private readonly searchFromRoute: Signal<string> = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('q') ?? '')),
    { initialValue: '' }
  );
  readonly search = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  weeklyClients: Signal<ClientActivity[]> = computed(() => getWeeklyClients(this.clientsState(), this.search()));

  constructor() {
    this.search.set(this.searchFromRoute());
    this.reload();
  }

  setSearch(term: string): void {
    this.search.set(term ?? '');
  }

  // EXERCICE 7b
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
