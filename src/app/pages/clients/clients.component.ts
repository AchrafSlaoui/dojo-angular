import { Component, ChangeDetectionStrategy, Signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Client } from '@app/models/client';
import { ClientUpdate } from '@clients/types/client.types';
import { ClientCardComponent } from '@app/components/client-card/client-card.component';
import { ClientsStore } from '@app/stores/clients.store';
import { NotificationService } from '@shared/services/notification.service';
import { firstValueFrom } from 'rxjs';
import { ConfirmService } from '@shared/services/confirm.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientCardComponent, ScrollingModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent {
  readonly store = inject(ClientsStore);
  private readonly notifications = inject(NotificationService);
  clients: Signal<Client[]> = this.store.paginatedClients;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly mutating = this.store.mutating;
  readonly totalClients = this.store.totalClients;
  readonly totalPages = this.store.totalPages;
  readonly page = this.store.page;
  readonly pageSize = this.store.pageSize;
  readonly allClients = this.store.filteredClients;
  readonly useVirtualScroll = computed(() => this.totalClients() > 100);
  adding = false;
  newClient: Omit<Client, 'id' | 'movements'> = { firstName: '', lastName: '', email: '', phone: '', address: '' };

  private readonly confirm = inject(ConfirmService);

  constructor() {}

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
      await firstValueFrom(this.store.addClient({ firstName, lastName, email, phone, address }));
      this.notifications.success(`Client ${firstName} ${lastName} cree.`);
      this.adding = false;
    } catch {
      this.notifications.error("Impossible d'ajouter le client.");
    }
  }

  cancelAdd(): void {
    this.adding = false;
  }

  async onSaveClient(update: ClientUpdate): Promise<void> {
    try {
      await firstValueFrom(this.store.updateClient(update));
      this.notifications.success('Client mis a jour.');
    } catch {
      this.notifications.error('La mise a jour du client a echoue.');
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
      await firstValueFrom(this.store.deleteClient(client.id));
      this.notifications.success('Client supprime.');
    } catch {
      this.notifications.error('La suppression du client a echoue.');
    }
  }

  trackByClientId(index: number, client: Client): string {
    return client.id;
  }

  nextPage(): void {
    this.store.nextPage();
  }

  previousPage(): void {
    this.store.previousPage();
  }

  onPageSizeChange(size: string): void {
    const parsed = Number(size);
    if (!Number.isNaN(parsed)) {
      this.store.setPageSize(parsed);
    }
  }
}
