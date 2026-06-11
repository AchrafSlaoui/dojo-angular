import { ChangeDetectionStrategy, Component, computed, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrimitiveLabItemComponent } from '../primitive-lab-item/primitive-lab-item.component';

type DemoPerson = { id: number; name: string; role: string };

const PERSONS: DemoPerson[] = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'Viewer' },
  { id: 3, name: 'Carol', role: 'Editor' },
];

@Component({
  selector: 'app-linked-signal-lab-card',
  standalone: true,
  imports: [FormsModule, PrimitiveLabItemComponent],
  templateUrl: './linked-signal-lab-card.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkedSignalLabCardComponent {
  readonly persons = PERSONS;
  readonly selected = signal<DemoPerson>(PERSONS[0]);

  // Lecture seule — toujours synchronisé, mais non éditable
  readonly computedName = computed(() => this.selected().name);

  // Éditable ET se remet à jour quand la sélection change
  readonly draftName = linkedSignal(() => this.selected().name);

  select(person: DemoPerson): void {
    this.selected.set(person);
  }
}
