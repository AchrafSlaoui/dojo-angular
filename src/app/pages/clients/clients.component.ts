import { Component, ChangeDetectionStrategy, Signal, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { firstValueFrom } from 'rxjs';
import { Client } from '@app/models/client';
import { ClientUpdate } from '@clients/types/client.types';
import { ClientCardComponent } from '@app/components/client-card/client-card.component';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { ClientsApiService } from '@app/services/clients-api.service';
import { listClients, paginateClients } from '@app/utils/clients-collection.util';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientCardComponent, ScrollingModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent {
  private readonly clientsApi = inject(ClientsApiService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  private readonly clientsState = signal<Client[]>([]);
  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);

  private readonly pageSlice = computed(() =>
    paginateClients({
      clients: this.clientsState(),
      search: this.search(),
      page: this.page(),
      pageSize: this.pageSize(),
    })
  );

  clients: Signal<Client[]> = computed(() => this.pageSlice().items);
  readonly totalClients = computed(() => this.pageSlice().total);
  readonly totalPages = computed(() => this.pageSlice().totalPages);
  readonly allClients = computed(() => listClients(this.clientsState(), this.search()));
  readonly useVirtualScroll = computed(() => this.totalClients() > 100);
  adding = false;
  newClient: Omit<Client, 'id' | 'movements'> = { firstName: '', lastName: '', email: '', phone: '', address: '' };

  constructor() {
    effect(() => {
      const clamped = this.pageSlice().page;
      if (clamped !== this.page()) {
        this.page.set(clamped);
      }
    });
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
      this.clientsState.update((list) => [created, ...list.filter((c) => c.id !== created.id)]);
      this.page.set(1);
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
      this.notifications.success('Client supprime.');
    } catch {
      this.notifications.error('La suppression du client a echoue.');
    } finally {
      this.mutating.set(false);
    }
  }

  trackByClientId(index: number, client: Client): string {
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
}
