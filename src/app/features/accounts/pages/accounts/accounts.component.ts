import { ChangeDetectionStrategy, Component, Signal, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Account, AccountCreate, AccountUpdate } from '@accounts/models/account';
import { AccountListComponent } from '@accounts/components/account-list/account-list.component';
import { AccountsFacade } from '@accounts/services/accounts.facade';
import { FormatValuePipe } from '@shared/pipes/format-value.pipe';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [FormsModule, AccountListComponent, FormatValuePipe],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AccountsFacade],
})
export class AccountsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly accountsFacade = inject(AccountsFacade);
  // Exemple toSignal()
  private readonly initialTypeFilter: Signal<string> = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('type') ?? 'all')),
    { initialValue: 'all' }
  );

  readonly search = this.accountsFacade.search;
  readonly typeFilter = this.accountsFacade.typeFilter;
  readonly loading = this.accountsFacade.loading;
  readonly mutating = this.accountsFacade.mutating;
  readonly error = this.accountsFacade.error;
  readonly accounts = this.accountsFacade.filteredAccounts;
  readonly totalBalance = this.accountsFacade.totalBalance;
  // EXERCICE 2
  get blockedAccountsCount(): number {
    return this.accountsFacade.blockedAccountsCount;
  }
  readonly clientId = input.required<string>();
  adding = false;
  // EXERCICE 4 - valeur bindee par la case "Afficher le statut".
  showStatus = true;
  editingAccountId: string | null = null;
  newAccount: AccountCreate = { label: '', type: 'checking', status: 'active' };
  // EXERCICE 5
  editAccount: AccountUpdate = { id: '', label: '', type: 'checking', status: 'active' };

  constructor() {
    this.accountsFacade.setTypeFilter(this.initialTypeFilter());
    effect(() => {
      void this.accountsFacade.load(this.clientId());
    });
  }

  setSearch(term: string): void {
    this.accountsFacade.setSearch(term);
  }

  setTypeFilter(type: string): void {
    this.accountsFacade.setTypeFilter(type);
  }

  startAdd(): void {
    this.adding = true;
    this.newAccount = { label: '', type: 'checking', status: 'active' };
  }

  cancelAdd(): void {
    this.adding = false;
  }

  async saveAdd(): Promise<void> {
    const created = await this.accountsFacade.add(this.newAccount);
    if (created) {
      this.adding = false;
    }
  }

  // EXERCICE 5
  startEdit(account: Account): void {
    this.editingAccountId = account.id;
    this.editAccount = {
      id: account.id,
      label: account.label,
      type: account.type,
      status: account.status,
    };
  }

  cancelEdit(): void {
    this.editingAccountId = null;
  }

  async saveEdit(): Promise<void> {
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
}
