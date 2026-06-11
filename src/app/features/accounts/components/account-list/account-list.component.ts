import { ChangeDetectionStrategy, Component, EventEmitter, Output, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Account, AccountUpdate } from '@accounts/models/account';
import { AccountCardComponent } from '@accounts/components/account-card/account-card.component';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [FormsModule, AccountCardComponent],
  templateUrl: './account-list.component.html',
  styleUrl: './account-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListComponent {
  accounts = input.required<Account[]>();
  clientId = input.required<string>();
  mutating = input(false);
  editingAccountId = input<string | null>(null);
  editAccount = input.required<AccountUpdate>();

  // Exemple output()
  editRequested = output<Account>();
  saveRequested = output<void>();
  cancelRequested = output<void>();
  deleteRequested = output<Account>();
  // EXERCICE 6
  @Output() selectedRequested = new EventEmitter<Account>();

  private readonly selectedAccount = signal<Account | null>(null, { equal: () => false });

  constructor() {
    effect(() => {
      const account = this.selectedAccount();
      if (account) {
        this.selectedRequested.emit(account);
      }
    });
  }

  requestEdit(account: Account): void {
    this.selectedAccount.set(account);
    this.editRequested.emit(account);
  }
}
