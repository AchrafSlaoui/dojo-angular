import { ChangeDetectionStrategy, Component, Input, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Account } from '@accounts/models/account';
import { FormatValuePipe } from '@shared/pipes/format-value.pipe';

@Component({
  selector: 'app-account-card',
  standalone: true,
  imports: [RouterLink, FormatValuePipe],
  templateUrl: './account-card.component.html',
  styleUrl: './account-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountCardComponent {
  // Exemple input()
  account = input.required<Account>();
  clientId = input.required<string>();
  // EXERCICE 5
  @Input() showStatus = true;

  // EXERCICE 5
  readonly visibleStatusLabel = computed(() => this.showStatus ? this.statusLabel() : null);

  readonly statusLabel = computed(() => {
    switch (this.account().status) {
      case 'active':
        return 'Actif';
      case 'blocked':
        return 'Bloque';
      case 'closed':
        return 'Cloture';
    }
  });

  readonly typeLabel = computed(() => {
    switch (this.account().type) {
      case 'checking':
        return 'Compte courant';
      case 'saving':
        return 'Epargne';
      case 'joint':
        return 'Compte joint';
    }
  });
}
