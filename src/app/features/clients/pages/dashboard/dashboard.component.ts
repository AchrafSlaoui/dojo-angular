import { Component, ChangeDetectionStrategy, Signal, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClientCardComponent } from '@clients/components/client-card/client-card.component';
import { ClientActivity } from '@clients/models/client-activity';
import { ClientsApiService } from '@clients/services/clients-api.service';
import { getWeeklyClients } from '@clients/utils/clients-collection.util';
import { catchError, map, of, startWith } from 'rxjs';

type DashboardClientsQuery = {
  clients: ClientActivity[];
  loading: boolean;
  error: string | null;
};

const initialClientsQuery: DashboardClientsQuery = {
  clients: [],
  loading: true,
  error: null,
};

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
  private readonly clientsQuery = toSignal(
    this.clientsApi.getAll().pipe(
      map((clients): DashboardClientsQuery => ({ clients, loading: false, error: null })),
      catchError((err) => {
        const message = err instanceof Error ? err.message : 'Impossible de charger les clients.';
        return of({ clients: [], loading: false, error: message });
      }),
      startWith(initialClientsQuery)
    ),
    { initialValue: initialClientsQuery }
  );
  private readonly searchFromRoute: Signal<string> = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('q') ?? '')),
    { initialValue: '' }
  );

  readonly search = signal('');
  readonly loading = computed(() => this.clientsQuery().loading);
  readonly error = computed(() => this.clientsQuery().error);

  weeklyClients: Signal<ClientActivity[]> = computed(() => getWeeklyClients(this.clientsQuery().clients, this.search()));

  constructor() {
    this.search.set(this.searchFromRoute());
  }

  setSearch(term: string): void {
    this.search.set(term ?? '');
  }
}
