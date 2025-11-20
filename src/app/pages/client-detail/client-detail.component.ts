import { Component, ChangeDetectionStrategy, Signal, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { MovementItemComponent } from '@app/components/movement-item/movement-item.component';
import { Client } from '@app/models/client';
import { Movement } from '@app/models/movement';
import { ClientsApiService } from '@app/services/clients-api.service';
import { MovementsApiService } from '@app/services/movements-api.service';
import { todayISO } from '@shared/utils/date.util';
import { FormatValuePipe } from '@shared/pipes/format-value.pipe';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmService } from '@shared/services/confirm.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MovementItemComponent, FormatValuePipe],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly clientsApi = inject(ClientsApiService);
  private readonly movementsApi = inject(MovementsApiService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  private readonly clientState = signal<Client | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly clientId: Signal<string | null> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null }
  );

  readonly client: Signal<Client | null> = this.clientState.asReadonly();
  readonly clientBalance: Signal<number> = computed(() => {
    const current = this.clientState();
    if (!current) return 0;
    const movements = current.movements ?? [];
    let total = 0;
    for (const m of movements) {
      total += m.type === 'credit' ? m.amount : -m.amount;
    }
    return Math.round(total * 100) / 100;
  });

  editingId: string | null = null;
  editMovement: Movement | null = null;

  newMovement: Omit<Movement, 'id'> = {
    date: todayISO(),
    type: 'debit',
    amount: 0,
    description: '',
  };

  constructor() {
    effect(() => {
      const id = this.clientId();
      if (id) {
        this.loadClient(id);
      }
    });
  }

  async addMovement(clientId: string): Promise<void> {
    if (!this.newMovement.amount || this.newMovement.amount <= 0) return;
    try {
      const created = await firstValueFrom(this.movementsApi.create(clientId, this.newMovement));
      this.clientState.update((client) =>
        client
          ? { ...client, movements: [created, ...((client.movements ?? []).filter((m) => m.id !== created.id))] }
          : client
      );
      this.notifications.success('Mouvement ajoute.');
      this.newMovement = { date: todayISO(), type: 'debit', amount: 0, description: '' };
    } catch {
      this.notifications.error('Impossible d\'ajouter le mouvement.');
    }
  }

  startEdit(m: Movement): void {
    this.editingId = m.id;
    this.editMovement = { ...m };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editMovement = null;
  }

  async saveEdit(clientId: string): Promise<void> {
    if (!this.editMovement) return;
    try {
      const updated = await firstValueFrom(this.movementsApi.update(clientId, this.editMovement));
      this.updateMovementInClient(clientId, updated);
      this.notifications.success('Mouvement mis a jour.');
      this.cancelEdit();
    } catch {
      this.notifications.error('La mise a jour du mouvement a echoue.');
    }
  }

  async updateMovement(clientId: string, movement: Movement): Promise<void> {
    try {
      const updated = await firstValueFrom(this.movementsApi.update(clientId, movement));
      this.updateMovementInClient(clientId, updated);
      this.notifications.success('Mouvement mis a jour.');
      this.cancelEdit();
    } catch {
      this.notifications.error('La mise a jour du mouvement a echoue.');
    }
  }

  async deleteMovement(clientId: string, movementId: string): Promise<void> {
    const client = this.client();
    const movement = client?.movements?.find((m) => m.id === movementId);
    const description = movement?.description ?? '';
    const approved = await this.confirm.confirm({
      title: 'Supprimer le mouvement',
      message: description ? `Supprimer le mouvement "${description}" ?` : 'Supprimer ce mouvement ?',
      confirmLabel: 'Supprimer',
    });
    if (!approved) return;

    try {
      await firstValueFrom(this.movementsApi.remove(clientId, movementId));
      this.clientState.update((current) =>
        current ? { ...current, movements: (current.movements ?? []).filter((m) => m.id !== movementId) } : current
      );
      if (this.editingId === movementId) this.cancelEdit();
      this.notifications.success('Mouvement supprime.');
    } catch {
      this.notifications.error('La suppression du mouvement a echoue.');
    }
  }

  trackByMovementId(index: number, movement: Movement): string {
    return movement.id;
  }

  private async loadClient(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.clientsApi.getById(id));
      this.clientState.set(data);
    } catch (err) {
      this.clientState.set(null);
      const message = err instanceof Error ? err.message : 'Impossible de charger le client.';
      this.error.set(message);
    } finally {
      this.loading.set(false);
    }
  }

  private updateMovementInClient(clientId: string, movement: Movement): void {
    this.clientState.update((client) =>
      client && client.id === clientId
        ? {
            ...client,
            movements: (client.movements ?? []).map((m) => (m.id === movement.id ? movement : m)),
          }
        : client
    );
  }
}
