import { ChangeDetectionStrategy, Component, Signal, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, firstValueFrom, map, of, switchMap } from 'rxjs';
import { Account, MovementCreate } from '@accounts/models/account';
import { AccountsApiService } from '@accounts/services/accounts-api.service';
import { MovementItemComponent } from '@accounts/components/movement-item/movement-item.component';
import { Movement } from '@accounts/models/movement';
import { FormatValuePipe } from '@shared/pipes/format-value.pipe';
import { ConfirmService } from '@shared/services/confirm.service';
import { NotificationService } from '@shared/services/notification.service';
import { todayISO } from '@shared/utils/date.util';

type MovementTypeFilter = Movement['type'] | 'all';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, MovementItemComponent, FormatValuePipe],
  templateUrl: './account-detail.component.html',
  styleUrl: './account-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly accountsApi = inject(AccountsApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);

  private readonly params$ = this.route.paramMap.pipe(
    map((params) => ({
      clientId: params.get('clientId') ?? params.get('id'),
      accountId: params.get('accountId'),
    }))
  );

  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);
  readonly movementSearch = signal('');
  readonly movementTypeFilter = signal<MovementTypeFilter>('all');
  private readonly updatedAccount = signal<Account | null>(null);
  addingMovement = false;
  newMovement: MovementCreate = this.createMovementDraft();

  readonly clientId: Signal<string | null> = toSignal(
    this.params$.pipe(map((params) => params.clientId)),
    { initialValue: null }
  );

  private readonly loadedAccount = toSignal(
    this.params$.pipe(
      switchMap(({ clientId, accountId }) => {
        if (!clientId || !accountId) {
          return of(null);
        }

        this.loading.set(true);
        this.error.set(null);
        this.updatedAccount.set(null);

        return this.accountsApi.getById(clientId, accountId).pipe(
          catchError((err) => {
            const message = err instanceof Error ? err.message : 'Impossible de charger le compte.';
            this.error.set(message);
            return of(null);
          })
        );
      }),
      map((account) => {
        this.loading.set(false);
        return account;
      })
    ),
    { initialValue: null as Account | null }
  );

  readonly account = computed(() => this.updatedAccount() ?? this.loadedAccount());

  readonly movementCount = computed(() => this.account()?.movements.length ?? 0);
  readonly filteredMovements = computed(() =>
    this.filterMovements(this.account()?.movements ?? [], this.movementSearch(), this.movementTypeFilter())
  );

  setMovementSearch(term: string): void {
    this.movementSearch.set(term ?? '');
  }

  setMovementTypeFilter(type: string): void {
    if (type === 'credit' || type === 'debit' || type === 'all') {
      this.movementTypeFilter.set(type);
    }
  }

  startAddMovement(): void {
    this.addingMovement = true;
    this.newMovement = this.createMovementDraft();
  }

  cancelAddMovement(): void {
    this.addingMovement = false;
  }

  async addMovement(): Promise<void> {
    const clientId = this.clientId();
    const account = this.account();
    const amount = Number(this.newMovement.amount);
    if (!clientId || !account || !this.newMovement.date || amount <= 0) {
      return;
    }

    try {
      this.mutating.set(true);
      this.error.set(null);
      const updatedAccount = await firstValueFrom(
        this.accountsApi.addMovement(clientId, account.id, {
          ...this.newMovement,
          amount,
        })
      );
      this.updatedAccount.set(updatedAccount);
      this.addingMovement = false;
      this.newMovement = this.createMovementDraft();
      this.notifications.success('Mouvement ajoute.');
    } catch {
      this.notifications.error("Impossible d'ajouter le mouvement.");
    } finally {
      this.mutating.set(false);
    }
  }

  async updateMovement(movement: Movement): Promise<void> {
    const clientId = this.clientId();
    const account = this.account();
    if (!clientId || !account || movement.amount <= 0) {
      return;
    }

    this.mutating.set(true);
    this.error.set(null);

    try {
      const updatedAccount = await firstValueFrom(
        this.accountsApi.updateMovement(clientId, account.id, movement)
      );
      this.updatedAccount.set(updatedAccount);
      this.notifications.success('Mouvement mis a jour.');
    } catch {
      this.notifications.error('Impossible de modifier le mouvement.');
    } finally {
      this.mutating.set(false);
    }
  }

  async deleteMovement(movementId: string): Promise<void> {
    const clientId = this.clientId();
    const account = this.account();
    if (!clientId || !account) {
      return;
    }

    const approved = await this.confirm.confirm({
      title: 'Supprimer le mouvement',
      message: 'Supprimer ce mouvement ?',
      confirmLabel: 'Supprimer',
    });
    if (!approved) return;

    try {
      this.mutating.set(true);
      this.error.set(null);
      const updatedAccount = await firstValueFrom(
        this.accountsApi.removeMovement(clientId, account.id, movementId)
      );
      this.updatedAccount.set(updatedAccount);
      this.notifications.success('Mouvement supprime.');
    } catch {
      this.notifications.error('La suppression du mouvement a echoue.');
    } finally {
      this.mutating.set(false);
    }
  }

  private createMovementDraft(): MovementCreate {
    return {
      date: todayISO(),
      type: 'credit',
      amount: 0,
      description: '',
    };
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
