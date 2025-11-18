import { Component, ChangeDetectionStrategy, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovementItemComponent } from '@app/components/movement-item/movement-item.component';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { Client } from '@app/models/client';
import { Movement } from '@app/models/movement';
import { MovementsApiService } from '@app/services/movements-api.service';
import { ClientsStore } from '@app/stores/clients.store';
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
  private readonly store = inject(ClientsStore);
  private readonly movementsApi = inject(MovementsApiService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  readonly clientId: Signal<string | null> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null }
  );

  readonly client: Signal<Client | null> = this.store.selectClientById(this.clientId);
  readonly clientBalance: Signal<number> = this.store.selectClientBalance(this.clientId);

  editingId: string | null = null;
  editMovement: Movement | null = null;

  newMovement: Omit<Movement, 'id'> = {
    date: todayISO(),
    type: 'debit',
    amount: 0,
    description: '',
  };

  constructor() {}

  async addMovement(clientId: string): Promise<void> {
    if (!this.newMovement.amount || this.newMovement.amount <= 0) return;
    try {
      const created = await firstValueFrom(this.movementsApi.create(clientId, this.newMovement));
      this.store.addMovementToClient(clientId, created);
      this.notifications.success('Mouvement ajouté.');
      this.newMovement = { date: todayISO(), type: 'debit', amount: 0, description: '' };
    } catch (err) {
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
      this.store.updateMovementInClient(clientId, updated);
      this.notifications.success('Mouvement mis à jour.');
      this.cancelEdit();
    } catch (err) {
      this.notifications.error('La mise à jour du mouvement a échoué.');
    }
  }

  async updateMovement(clientId: string, movement: Movement): Promise<void> {
    try {
      const updated = await firstValueFrom(this.movementsApi.update(clientId, movement));
      this.store.updateMovementInClient(clientId, updated);
      this.notifications.success('Mouvement mis à jour.');
      this.cancelEdit();
    } catch (err) {
      this.notifications.error('La mise à jour du mouvement a échoué.');
    }
  }

  async deleteMovement(clientId: string, movementId: string): Promise<void> {
    const client = this.client();
    const movement = client?.movements?.find((m) => m.id === movementId);
    const description = movement?.description ?? '';
    const approved = await this.confirm.confirm({
      title: 'Supprimer le mouvement',
      message: description
        ? `Supprimer le mouvement « ${description} » ?`
        : 'Supprimer ce mouvement ?',
      confirmLabel: 'Supprimer',
    });
    if (!approved) return;

    try {
      await firstValueFrom(this.movementsApi.remove(clientId, movementId));
      this.store.removeMovementFromClient(clientId, movementId);
      if (this.editingId === movementId) this.cancelEdit();
      this.notifications.success('Mouvement supprimé.');
    } catch (err) {
      this.notifications.error('La suppression du mouvement a échoué.');
    }
  }

  trackByMovementId(index: number, movement: Movement): string {
    return movement.id;
  }
}
