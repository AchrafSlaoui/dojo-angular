import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PrimitiveLabItemComponent } from '../primitive-lab-item/primitive-lab-item.component';

type Item = { id: number; label: string };

const INITIAL: Item[] = [
  { id: 1, label: 'Alice' },
  { id: 2, label: 'Bob' },
  { id: 3, label: 'Carol' },
  { id: 4, label: 'Dave' },
];

@Component({
  selector: 'app-zone-computed-lab-card',
  standalone: true,
  imports: [PrimitiveLabItemComponent],
  templateUrl: './zone-computed-lab-card.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneComputedLabCardComponent {
  readonly items = signal<Item[]>([...INITIAL]);
  cdCount = 0;

  // Getter — recalculé à chaque cycle de détection
  getterCallCount = 0;
  get shortLabels(): string[] {
    this.getterCallCount += 1;
    return this.items().filter(i => i.label.length <= 4).map(i => i.label);
  }

  // computed() — recalculé seulement si items() change
  computedCallCount = 0;
  readonly shortLabelsComputed = computed(() => {
    this.computedCallCount += 1;
    return this.items().filter(i => i.label.length <= 4).map(i => i.label);
  });

  triggerCd(): void {
    this.cdCount += 1;
  }

  addItem(): void {
    const id = this.items().length + 1;
    this.items.update(list => [...list, { id, label: id % 2 === 0 ? 'Eve' : 'Frank' }]);
  }

  reset(): void {
    this.items.set([...INITIAL]);
    this.cdCount = 0;
    this.getterCallCount = 0;
    this.computedCallCount = 0;
  }
}
