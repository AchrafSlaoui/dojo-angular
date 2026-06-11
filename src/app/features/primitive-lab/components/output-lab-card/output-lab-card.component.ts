import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PrimitiveLabItemComponent } from '../primitive-lab-item/primitive-lab-item.component';

@Component({
  selector: 'app-output-lab-card',
  standalone: true,
  imports: [PrimitiveLabItemComponent],
  templateUrl: './output-lab-card.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutputLabCardComponent {}
