import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Account, MovementCreate } from '@accounts/models/account';
import { Movement } from '@accounts/models/movement';
import { AccountsApiService } from '@accounts/services/accounts-api.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { NotificationService } from '@shared/services/notification.service';

export type MovementTypeFilter = Movement['type'] | 'all';

@Injectable()
export class MovementsFacade {
  private readonly accountsApi = inject(AccountsApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly accountState = signal<Account | null>(null);

  readonly search = signal('');
  readonly typeFilter = signal<MovementTypeFilter>('all');
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);
  readonly account = this.accountState.asReadonly();
  readonly movementCount = computed(() => this.accountState()?.movements.length ?? 0);
  readonly filteredMovements = computed(() =>
    this.filterMovements(this.accountState()?.movements ?? [], this.search(), this.typeFilter())
  );

  setAccount(account: Account | null): void {
    this.accountState.set(account);
  }

  setSearch(term: string): void {
    this.search.set(term ?? '');
  }

  setTypeFilter(type: string): void {
    if (type === 'credit' || type === 'debit' || type === 'all') {
      this.typeFilter.set(type);
    }
  }

  async add(clientId: string | null, movement: MovementCreate): Promise<Account | null> {
    const account = this.accountState();
    const amount = Number(movement.amount);
    if (!clientId || !account || !movement.date || amount <= 0) return null;

    try {
      this.mutating.set(true);
      this.error.set(null);
      const updated = await firstValueFrom(
        this.accountsApi.addMovement(clientId, account.id, { ...movement, amount })
      );
      this.accountState.set(updated);
      this.notifications.success('Mouvement ajoute.');
      return updated;
    } catch {
      this.notifications.error("Impossible d'ajouter le mouvement.");
      return null;
    } finally {
      this.mutating.set(false);
    }
  }

  async update(clientId: string | null, movement: Movement): Promise<Account | null> {
    const account = this.accountState();
    if (!clientId || !account || movement.amount <= 0) return null;

    try {
      this.mutating.set(true);
      this.error.set(null);
      const updated = await firstValueFrom(this.accountsApi.updateMovement(clientId, account.id, movement));
      this.accountState.set(updated);
      this.notifications.success('Mouvement mis a jour.');
      return updated;
    } catch {
      this.notifications.error('Impossible de modifier le mouvement.');
      return null;
    } finally {
      this.mutating.set(false);
    }
  }

  async remove(clientId: string | null, movementId: string): Promise<Account | null> {
    const account = this.accountState();
    if (!clientId || !account) return null;

    const approved = await this.confirm.confirm({
      title: 'Supprimer le mouvement',
      message: 'Supprimer ce mouvement ?',
      confirmLabel: 'Supprimer',
    });
    if (!approved) return null;

    try {
      this.mutating.set(true);
      this.error.set(null);
      const updated = await firstValueFrom(this.accountsApi.removeMovement(clientId, account.id, movementId));
      this.accountState.set(updated);
      this.notifications.success('Mouvement supprime.');
      return updated;
    } catch {
      this.notifications.error('La suppression du mouvement a echoue.');
      return null;
    } finally {
      this.mutating.set(false);
    }
  }

  private filterMovements(movements: Movement[], search: string, typeFilter: MovementTypeFilter): Movement[] {
    const term = search.trim().toLowerCase();
    return movements.filter((movement) => {
      const matchesType = typeFilter === 'all' || movement.type === typeFilter;
      const description = movement.description?.toLowerCase() ?? '';
      const matchesSearch = !term || description.includes(term) || movement.date.includes(term);
      return matchesType && matchesSearch;
    });
  }
}
