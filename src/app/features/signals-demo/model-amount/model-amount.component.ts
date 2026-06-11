import { ChangeDetectionStrategy, Component, model } from '@angular/core';

@Component({
  selector: 'app-model-amount',
  standalone: true,
  styles: [`
    .model-amount {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }

    input {
      min-width: 10rem;
      padding: 0.35rem 0.55rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text);
    }
  `],
  template: `
    <label class="model-amount">
      Montant
      <input
        type="number"
        [value]="value()"
        (input)="value.set(+$any($event.target).value)"
      />
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelAmountComponent {
  value = model(0);
}
