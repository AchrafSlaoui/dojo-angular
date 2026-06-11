import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  model,
  signal,
} from '@angular/core';
import { PrimitiveLabItemComponent } from '../primitive-lab-item/primitive-lab-item.component';

@Component({
  selector: 'app-lab-model-legacy-child',
  standalone: true,
  template: `
    <div class="child-box">
      <code>@Input() + @Output()</code>
      <div style="display:flex;gap:.5rem;align-items:center;margin:.25rem 0">
        <button class="btn outline" type="button" (click)="valueChange.emit(value - 1)">-</button>
        <strong>{{ value }}</strong>
        <button class="btn primary" type="button" (click)="valueChange.emit(value + 1)">+</button>
      </div>
      <span class="badge badge-warn">3 declarations cote enfant</span>
    </div>
  `,
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabModelLegacyChildComponent {
  @Input() value = 0;
  @Output() valueChange = new EventEmitter<number>();
}

@Component({
  selector: 'app-lab-model-child',
  standalone: true,
  template: `
    <div class="child-box">
      <code>model()</code>
      <div style="display:flex;gap:.5rem;align-items:center;margin:.25rem 0">
        <button class="btn outline" type="button" (click)="value.update(v => v - 1)">-</button>
        <strong>{{ value() }}</strong>
        <button class="btn primary" type="button" (click)="value.update(v => v + 1)">+</button>
      </div>
      <span class="badge badge-ok">1 declaration cote enfant</span>
    </div>
  `,
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabModelChildComponent {
  value = model(0);
}

@Component({
  selector: 'app-model-lab-card',
  standalone: true,
  imports: [LabModelChildComponent, LabModelLegacyChildComponent, PrimitiveLabItemComponent],
  templateUrl: './model-lab-card.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelLabCardComponent {
  readonly modelValue = signal(10);
  legacyValue = 10;

  onLegacyChange(v: number): void {
    this.legacyValue = v;
  }
}
