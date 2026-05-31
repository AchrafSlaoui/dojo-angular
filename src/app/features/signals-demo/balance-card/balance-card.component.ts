import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

// Composant enfant — démo input() + output()
@Component({
  selector: 'app-balance-card',
  standalone: true,
  styles: [`
    .balance-card { display: flex; flex-direction: column; gap: 0.5rem; }
    p { margin: 0; font-size: 0.9rem; }
    button {
      align-self: flex-start;
      padding: 0.35rem 0.9rem;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      background: transparent;
      color: var(--danger, #dc2626);
      border: 1px solid var(--danger, #dc2626);
    }
    button:hover { background: #fef2f2; }
  `],
  template: `
    <div class="balance-card">
      <p>Valeur reçue via <code>input()</code> : <strong>{{ amount() }} €</strong></p>
      <button type="button" (click)="resetRequested.emit()">Remettre à zéro (output)</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceCardComponent {
  amount           = input.required<number>();  // entrée signal
  resetRequested   = output<void>();            // sortie — intention vers le parent
}
