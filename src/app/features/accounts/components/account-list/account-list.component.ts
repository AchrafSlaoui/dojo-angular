import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, output } from '@angular/core';
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

  editRequested = output<Account>();
  saveRequested = output<void>();
  cancelRequested = output<void>();
  deleteRequested = output<Account>();
  @Output() selectedRequested = new EventEmitter<Account>();
}
