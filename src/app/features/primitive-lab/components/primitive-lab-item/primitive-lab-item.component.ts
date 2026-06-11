import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-primitive-lab-item',
  standalone: true,
  templateUrl: './primitive-lab-item.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimitiveLabItemComponent {
  readonly apis = input.required<string[]>();
  readonly title = input.required<string>();
  readonly risk = input.required<string>();
}
