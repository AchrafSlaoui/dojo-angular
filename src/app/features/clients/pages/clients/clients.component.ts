import { Component, ChangeDetectionStrategy, ElementRef, Signal, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom } from 'rxjs';
import { Client } from '@clients/models/client';
import { ClientActivity } from '@clients/models/client-activity';
import { ClientUpdate } from '@clients/types/client.types';
import { ClientCardComponent } from '@clients/components/client-card/client-card.component';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { ClientsApiService } from '@clients/services/clients-api.service';
import { ClientSort, listClients, paginateClients } from '@clients/utils/clients-collection.util';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, ClientCardComponent, ScrollingModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent {
  private readonly clientsApi = inject(ClientsApiService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  // Exemple signal()
  private readonly clientsState = signal<ClientActivity[]>([]);
  readonly search = signal('');
  readonly sort = signal<ClientSort>('latestMovement');
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);

  // Exemple computed()
  private readonly pageSlice = computed(() =>
    paginateClients({
      clients: this.clientsState(),
      search: this.search(),
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize(),
    })
  );

  clients: Signal<ClientActivity[]> = computed(() => this.pageSlice().items);
  readonly totalClients = computed(() => this.pageSlice().total);
  readonly totalPages = computed(() => this.pageSlice().totalPages);
  readonly allClients = computed(() => listClients(this.clientsState(), this.search(), this.sort()));
  readonly useVirtualScroll = computed(() => this.totalClients() > 100);
  // EXERCICE 1
  adding = false;
  newClient: Omit<Client, 'id'> = { firstName: '', lastName: '', email: '', phone: '', address: '' };
  // EXERCICE 4
  @ViewChild('firstNameRef') private firstNameInput?: ElementRef;
  // Exemple toObservable()
  readonly debouncedSearch$ = toObservable(this.search).pipe(debounceTime(300));

  constructor() {
    // Exemple effect()
    effect(() => {
      document.title = this.totalClients() > 0 ? `Clients (${this.totalClients()})` : 'Clients';
    });

    // EXERCICE 3
    this.loadClients();
  }

  private async loadClients(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.clientsApi.getAll());
      this.clientsState.set(data);
      this.page.set(1);
    } catch (err) {
      this.clientsState.set([]);
      const message = err instanceof Error ? err.message : 'Impossible de charger les clients.';
      this.error.set(message);
    } finally {
      this.loading.set(false);
    }
  }

  startAdd(): void {
    this.adding = true;
    this.newClient = { firstName: '', lastName: '', email: '', phone: '', address: '' };
  }

  async saveAdd(): Promise<void> {
    const firstName = this.newClient.firstName?.trim();
    const lastName = this.newClient.lastName?.trim();
    if (!firstName || !lastName) return;
    const { email, phone, address } = this.newClient;
    try {
      this.mutating.set(true);
      const created = await firstValueFrom(this.clientsApi.add({ firstName, lastName, email, phone, address }));
      this.clientsState.update((list) => [{ ...created, recentMovements: [] }, ...list.filter((c) => c.id !== created.id)]);
      this.page.set(1);
      // EXERCICE 9
      this.notifications.success(`Client ${firstName} ${lastName} cree.`);
      this.adding = false;
    } catch {
      this.notifications.error("Impossible d'ajouter le client.");
    } finally {
      this.mutating.set(false);
    }
  }

  cancelAdd(): void {
    this.adding = false;
  }

  async onSaveClient(update: ClientUpdate): Promise<void> {
    try {
      this.mutating.set(true);
      const updated = await firstValueFrom(this.clientsApi.update(update));
      this.clientsState.update((list) => list.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      this.notifications.success('Client mis a jour.');
    } catch {
      this.notifications.error('La mise a jour du client a echoue.');
    } finally {
      this.mutating.set(false);
    }
  }

  async deleteClient(client: Client): Promise<void> {
    const approved = await this.confirm.confirm({
      title: 'Supprimer le client',
      message: `Supprimer ${client.firstName} ${client.lastName} ?`,
      confirmLabel: 'Supprimer',
    });
    if (!approved) return;
    try {
      this.mutating.set(true);
      await firstValueFrom(this.clientsApi.remove(client.id));
      this.clientsState.update((list) => list.filter((c) => c.id !== client.id));
      this.clampCurrentPage(); // EXERCICE 3
      this.notifications.success('Client supprime.');
    } catch {
      this.notifications.error('La suppression du client a echoue.');
    } finally {
      this.mutating.set(false);
    }
  }

  trackByClientId(_index: number, client: Client): string {
    return client.id;
  }

  nextPage(): void {
    this.page.set(Math.min(this.page() + 1, this.totalPages()));
  }

  previousPage(): void {
    this.page.set(Math.max(this.page() - 1, 1));
  }

  onPageSizeChange(size: string): void {
    const parsed = Number(size);
    if (!Number.isNaN(parsed)) {
      const nextSize = Math.max(1, Math.floor(parsed));
      if (nextSize !== this.pageSize()) {
        this.pageSize.set(nextSize);
        this.page.set(1);
      }
    }
  }

  setSearch(term: string): void {
    this.search.set(term ?? '');
    this.page.set(1);
  }

  setSort(sort: string): void {
    if (sort !== 'latestMovement' && sort !== 'totalMovementsDesc' && sort !== 'totalMovementsAsc') {
      return;
    }
    this.sort.set(sort);
    this.page.set(1);
  }

  // EXERCICE 3
  private clampCurrentPage(): void {
    const clamped = this.pageSlice().page;
    if (clamped !== this.page()) {
      this.page.set(clamped);
    }
  }
}
