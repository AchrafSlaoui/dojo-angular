import { Component, ChangeDetectionStrategy, Signal, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { Account, AccountCreate, AccountUpdate } from '@accounts/models/account';
import { AccountListComponent } from '@accounts/components/account-list/account-list.component';
import { AccountsFacade } from '@accounts/services/accounts.facade';
import { Client } from '@clients/models/client';
import { ClientAccountsFacade } from '@clients/services/client-accounts.facade';
import { FormatValuePipe } from '@shared/pipes/format-value.pipe';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [FormsModule, AccountListComponent, FormatValuePipe],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AccountsFacade],
})
export class ClientDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly clientAccounts = inject(ClientAccountsFacade);
  private readonly accountsFacade = inject(AccountsFacade);

  private readonly clientState = signal<Client | null>(null);
  readonly loading = signal(false);
  readonly mutating = this.accountsFacade.mutating;
  readonly error = signal<string | null>(null);
  readonly accountSearch = this.accountsFacade.search;
  readonly accountTypeFilter = this.accountsFacade.typeFilter;
  addingAccount = false;
  editingAccountId: string | null = null;
  failedPhotoClientId: string | null = null;
  newAccount: AccountCreate = this.createAccountDraft();
  editAccount: AccountUpdate = { id: '', label: '', type: 'checking', status: 'active' };

  readonly clientId: Signal<string | null> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null }
  );

  readonly client: Signal<Client | null> = this.clientState.asReadonly();
  readonly accounts: Signal<Account[]> = this.accountsFacade.accounts;
  readonly filteredAccounts: Signal<Account[]> = this.accountsFacade.filteredAccounts;
  readonly clientBalance: Signal<number> = this.accountsFacade.clientBalance;

  constructor() {
    effect(() => {
      const id = this.clientId();
      if (id) {
        this.loadClient(id);
      }
    });
  }

  setAccountSearch(term: string): void {
    this.accountsFacade.setSearch(term);
  }

  setAccountTypeFilter(type: string): void {
    this.accountsFacade.setTypeFilter(type);
  }

  shouldShowClientPhoto(client: Client): boolean {
    return !!client.photoUrl && this.failedPhotoClientId !== client.id;
  }

  clientInitials(client: Client): string {
    return `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
  }

  onClientPhotoError(client: Client): void {
    this.failedPhotoClientId = client.id;
  }

  private async loadClient(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const { client, accounts } = await this.clientAccounts.getClientAccounts(id);
      this.clientState.set(client);
      this.accountsFacade.setClientId(id);
      this.accountsFacade.setAccounts(accounts);
    } catch (err) {
      this.clientState.set(null);
      this.accountsFacade.setAccounts([]);
      const message = err instanceof Error ? err.message : 'Impossible de charger le client.';
      this.error.set(message);
    } finally {
      this.loading.set(false);
    }
  }

  startAddAccount(): void {
    this.addingAccount = true;
    this.newAccount = this.createAccountDraft();
  }

  cancelAddAccount(): void {
    this.addingAccount = false;
  }

  async saveAddAccount(): Promise<void> {
    const created = await this.accountsFacade.add(this.newAccount);
    if (created) {
      this.addingAccount = false;
    }
  }

  startEditAccount(account: Account): void {
    this.editingAccountId = account.id;
    this.editAccount = {
      id: account.id,
      label: account.label,
      type: account.type,
      status: account.status,
    };
  }

  cancelEditAccount(): void {
    this.editingAccountId = null;
  }

  async saveEditAccount(): Promise<void> {
    const updated = await this.accountsFacade.update(this.editAccount);
    if (updated) {
      this.editingAccountId = null;
    }
  }

  async deleteAccount(account: Account): Promise<void> {
    const removed = await this.accountsFacade.remove(account);
    if (removed) {
      if (this.editingAccountId === account.id) {
        this.editingAccountId = null;
      }
    }
  }

  private createAccountDraft(): AccountCreate {
    return { label: '', type: 'checking', status: 'active' };
  }
}
