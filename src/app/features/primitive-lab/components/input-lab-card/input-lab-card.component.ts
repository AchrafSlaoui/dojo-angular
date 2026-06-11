import { ChangeDetectionStrategy, Component, Input, computed, input, signal } from '@angular/core';
import { PrimitiveLabItemComponent } from '../primitive-lab-item/primitive-lab-item.component';

@Component({
  selector: 'app-lab-input-child',
  standalone: true,
  template: `
    <div class="child-box">
      <div>
        <code>@Input() lu directement</code>
        <strong>{{ classicExpected }}</strong>
        <span class="badge badge-warn">pas une dependance signal</span>
      </div>
      <div>
        <code>@Input() dans computed()</code>
        <strong class="err">{{ classicLabel() }}</strong>
        <span class="badge badge-err">FIGE sur valeur initiale</span>
        <p class="err">computed() n'a pas de dependance signal — ne se recalcule jamais.</p>
      </div>
      <div>
        <code>input() dans computed()</code>
        <strong>{{ signalLabel() }}</strong>
        <span class="badge badge-ok">mis a jour</span>
      </div>
    </div>
  `,
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabInputChildComponent {
  @Input() classicShowDetails = true;
  signalShowDetails = input(true);

  get classicExpected(): string {
    return this.classicShowDetails ? 'details visibles' : 'details masques';
  }

  readonly classicLabel = computed(() =>
    this.classicShowDetails ? 'details visibles' : 'details masques',
  );
  readonly signalLabel = computed(() =>
    this.signalShowDetails() ? 'details visibles' : 'details masques',
  );
}

@Component({
  selector: 'app-input-lab-card',
  standalone: true,
  imports: [LabInputChildComponent, PrimitiveLabItemComponent],
  templateUrl: './input-lab-card.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputLabCardComponent {
  classicShowDetails = true;
  readonly signalShowDetails = signal(true);
  toggleCount = 0;

  toggleInputDemo(): void {
    this.classicShowDetails = !this.classicShowDetails;
    this.signalShowDetails.update(v => !v);
    this.toggleCount += 1;
  }
}
