import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';
import { Account, AccountCreate, AccountType, AccountUpdate } from '@accounts/models/account';
import { AccountsApiService } from '@accounts/services/accounts-api.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { NotificationService } from '@shared/services/notification.service';

export type AccountTypeFilter = AccountType | 'all';

@Injectable()
export class AccountsFacade {
  private readonly accountsApi = inject(AccountsApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly accountsState = signal<Account[]>([]);
  private readonly clientIdState = signal<string | null>(null);

  readonly search = signal('');
  readonly typeFilter = signal<AccountTypeFilter>('all');
  // EXERCICE 10
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);

  // Exemple signal.asReadonly()
  readonly accounts = this.accountsState.asReadonly();
  readonly clientId = this.clientIdState.asReadonly();
  // Exemple computed()
  readonly filteredAccounts = computed(() =>
    this.filterAccounts(this.accountsState(), this.search(), this.typeFilter())
  );
  // Exemple computed()
  readonly totalBalance = computed(() =>
    Math.round(this.filteredAccounts().reduce((total, account) => total + account.balance, 0) * 100) / 100
  );
  readonly clientBalance = computed(() =>
    Math.round(this.accountsState().reduce((total, account) => total + account.balance, 0) * 100) / 100
  );
  // EXERCICE 2
  get blockedAccountsCount(): number {
    return this.filteredAccounts().filter((account) => account.status === 'blocked').length;
  }


  setClientId(clientId: string | null): void {
    this.clientIdState.set(clientId);
  }

  setAccounts(accounts: Account[]): void {
    this.accountsState.set(accounts);
  }

  async load(clientId: string | null): Promise<void> {
    this.setClientId(clientId);
    if (!clientId) {
      this.accountsState.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.accountsState.set([]);

    const accounts = await firstValueFrom(
      this.accountsApi.getByClientId(clientId).pipe(
        catchError((err) => {
          const message = err instanceof Error ? err.message : 'Impossible de charger les comptes.';
          this.error.set(message);
          return of([] as Account[]);
        })
      )
    );
    this.accountsState.set(accounts);
    this.loading.set(false);
  }

  setSearch(term: string): void {
    this.search.set(term ?? '');
  }

  setTypeFilter(type: string): void {
    if (type === 'checking' || type === 'saving' || type === 'joint' || type === 'all') {
      this.typeFilter.set(type);
    }
  }

  async add(account: AccountCreate): Promise<Account | null> {
    const clientId = this.clientId();
    const label = account.label.trim();
    if (!clientId || !label) return null;

    try {
      this.mutating.set(true);
      const created = await firstValueFrom(this.accountsApi.add(clientId, { ...account, label }));
      this.accountsState.update((accounts) => [created, ...accounts]);
      this.notifications.success('Compte cree.');
      return created;
    } catch {
      this.notifications.error("Impossible d'ajouter le compte.");
      return null;
    } finally {
      this.mutating.set(false);
    }
  }

  async update(account: AccountUpdate): Promise<Account | null> {
    const clientId = this.clientId();
    const label = account.label?.trim();
    if (!clientId || !account.id || !label) return null;

    try {
      this.mutating.set(true);
      const updated = await firstValueFrom(this.accountsApi.update(clientId, { ...account, label }));
      this.accountsState.update((accounts) =>
        accounts.map((item) => item.id === updated.id ? updated : item)
      );
      this.notifications.success('Compte mis a jour.');
      return updated;
    } catch {
      this.notifications.error('La mise a jour du compte a echoue.');
      return null;
    } finally {
      this.mutating.set(false);
    }
  }

  async remove(account: Account): Promise<boolean> {
    const clientId = this.clientId();
    if (!clientId) return false;

    const approved = await this.confirm.confirm({
      title: 'Supprimer le compte',
      message: `Supprimer ${account.label} ?`,
      confirmLabel: 'Supprimer',
    });
    if (!approved) return false;

    try {
      this.mutating.set(true);
      await firstValueFrom(this.accountsApi.remove(clientId, account.id));
      this.accountsState.update((accounts) => accounts.filter((item) => item.id !== account.id));
      this.notifications.success('Compte supprime.');
      return true;
    } catch {
      this.notifications.error('La suppression du compte a echoue.');
      return false;
    } finally {
      this.mutating.set(false);
    }
  }

  private filterAccounts(accounts: Account[], search: string, typeFilter: AccountTypeFilter): Account[] {
    const term = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesType = typeFilter === 'all' || account.type === typeFilter;
      const matchesSearch = !term || account.label.toLowerCase().includes(term);
      return matchesType && matchesSearch;
    });
  }
}
