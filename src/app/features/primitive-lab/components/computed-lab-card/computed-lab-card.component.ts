import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PrimitiveLabItemComponent } from '../primitive-lab-item/primitive-lab-item.component';

type DemoAccount = {
  id: number;
  label: string;
  status: 'active' | 'blocked';
};

@Component({
  selector: 'app-computed-lab-card',
  standalone: true,
  imports: [PrimitiveLabItemComponent],
  templateUrl: './computed-lab-card.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComputedLabCardComponent {
  readonly accounts = signal<DemoAccount[]>([
    { id: 1, label: 'Compte courant', status: 'active' },
    { id: 2, label: 'Livret projet', status: 'active' },
    { id: 3, label: 'Compte incident', status: 'blocked' },
  ]);

  functionCallCount = 0;
  functionResult = 0;

  computedReadCount = 0;
  computedCalcCount = 0;
  computedResult = 0;
  computedHasRun = false;

  readonly blockedCount = computed(() => {
    this.computedCalcCount += 1;
    return this.accounts().filter(a => a.status === 'blocked').length;
  });

  readWithFunction(): void {
    this.functionResult = this.computeBlockedCount();
  }

  readWithComputed(): void {
    this.computedHasRun = true;
    this.computedReadCount += 1;
    this.computedResult = this.blockedCount();
  }

  addBlockedAccount(): void {
    const nextId = this.accounts().length + 1;
    this.accounts.update(acc => [
      ...acc,
      { id: nextId, label: `Compte bloque ${nextId}`, status: 'blocked' },
    ]);
  }

  reset(): void {
    this.accounts.set([
      { id: 1, label: 'Compte courant', status: 'active' },
      { id: 2, label: 'Livret projet', status: 'active' },
      { id: 3, label: 'Compte incident', status: 'blocked' },
    ]);
    this.functionCallCount = 0;
    this.functionResult = 0;
    this.computedReadCount = 0;
    this.computedCalcCount = 0;
    this.computedResult = 0;
    this.computedHasRun = false;
  }

  private computeBlockedCount(): number {
    this.functionCallCount += 1;
    return this.accounts().filter(a => a.status === 'blocked').length;
  }
}
