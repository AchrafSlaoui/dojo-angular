import { ChangeDetectionStrategy, Component, Signal, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { Account, MovementCreate } from '@accounts/models/account';
import { AccountsApiService } from '@accounts/services/accounts-api.service';
import { MovementItemComponent } from '@accounts/components/movement-item/movement-item.component';
import { Movement } from '@accounts/models/movement';
import { MovementsFacade } from '@accounts/services/movements.facade';
import { FormatValuePipe } from '@shared/pipes/format-value.pipe';
import { todayISO } from '@shared/utils/date.util';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, MovementItemComponent, FormatValuePipe],
  templateUrl: './account-detail.component.html',
  styleUrl: './account-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MovementsFacade],
})
export class AccountDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly accountsApi = inject(AccountsApiService);
  private readonly movementsFacade = inject(MovementsFacade);

  private readonly params$ = this.route.paramMap.pipe(
    map((params) => ({
      clientId: params.get('clientId') ?? params.get('id'),
      accountId: params.get('accountId'),
    }))
  );

  readonly loading = signal(false);
  readonly mutating = this.movementsFacade.mutating;
  readonly error = signal<string | null>(null);
  readonly movementSearch = this.movementsFacade.search;
  readonly movementTypeFilter = this.movementsFacade.typeFilter;
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
        this.movementsFacade.setAccount(null);

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

  readonly account = this.movementsFacade.account;

  readonly movementCount = this.movementsFacade.movementCount;
  readonly filteredMovements = this.movementsFacade.filteredMovements;

  constructor() {
    effect(() => {
      this.movementsFacade.setAccount(this.loadedAccount());
    });
  }

  setMovementSearch(term: string): void {
    this.movementsFacade.setSearch(term);
  }

  setMovementTypeFilter(type: string): void {
    this.movementsFacade.setTypeFilter(type);
  }

  startAddMovement(): void {
    this.addingMovement = true;
    this.newMovement = this.createMovementDraft();
  }

  cancelAddMovement(): void {
    this.addingMovement = false;
  }

  async addMovement(): Promise<void> {
    const updated = await this.movementsFacade.add(this.clientId(), this.newMovement);
    if (updated) {
      this.addingMovement = false;
      this.newMovement = this.createMovementDraft();
    }
  }

  async updateMovement(movement: Movement): Promise<void> {
    await this.movementsFacade.update(this.clientId(), movement);
  }

  async deleteMovement(movementId: string): Promise<void> {
    await this.movementsFacade.remove(this.clientId(), movementId);
  }

  private createMovementDraft(): MovementCreate {
    return {
      date: todayISO(),
      type: 'credit',
      amount: 0,
      description: '',
    };
  }
}
