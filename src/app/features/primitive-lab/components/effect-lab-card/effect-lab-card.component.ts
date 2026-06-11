import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { PrimitiveLabItemComponent } from '../primitive-lab-item/primitive-lab-item.component';

@Component({
  selector: 'app-effect-lab-card',
  standalone: true,
  imports: [PrimitiveLabItemComponent],
  templateUrl: './effect-lab-card.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectLabCardComponent {
  classicRows = ['Ada', 'Grace', 'Alan'];
  classicPage = 2;
  readonly signalRows = signal(['Ada', 'Grace', 'Alan']);
  readonly signalPage = signal(2);
  readonly signalTotalPages = computed(() => Math.max(1, Math.ceil(this.signalRows().length / 2)));

  constructor() {
    effect(() => {
      const maxPage = this.signalTotalPages();
      if (this.signalPage() > maxPage) {
        this.signalPage.set(maxPage);
      }
    });
  }

  get classicTotalPages(): number {
    return Math.max(1, Math.ceil(this.classicRows.length / 2));
  }

  removeRows(): void {
    this.classicRows = ['Ada'];
    this.signalRows.set(['Ada']);
  }

  resetRows(): void {
    this.classicRows = ['Ada', 'Grace', 'Alan'];
    this.classicPage = 2;
    this.signalRows.set(['Ada', 'Grace', 'Alan']);
    this.signalPage.set(2);
  }
}
