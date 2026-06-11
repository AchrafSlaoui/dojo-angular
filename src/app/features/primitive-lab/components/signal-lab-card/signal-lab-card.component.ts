import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PrimitiveLabItemComponent } from '../primitive-lab-item/primitive-lab-item.component';

@Component({
  selector: 'app-signal-lab-card',
  standalone: true,
  imports: [PrimitiveLabItemComponent],
  templateUrl: './signal-lab-card.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalLabCardComponent {
  classicAdding = false;
  classicLog = '';
  readonly signalAdding = signal(false);
  readonly wakeCount = signal(0);

  launchClassicTimer(): void {
    this.classicAdding = false;
    this.classicLog = 'Timer en cours (1 s)...';
    window.setTimeout(() => {
      this.classicAdding = true;
      this.classicLog = 'TS : true depuis 1 s — la vue OnPush est restée figée.';
    }, 1000);
  }

  launchSignalTimer(): void {
    this.signalAdding.set(false);
    window.setTimeout(() => {
      this.signalAdding.set(true);
    }, 1000);
  }

  wakeAngular(): void {
    this.wakeCount.update(n => n + 1);
  }

  reset(): void {
    this.classicAdding = false;
    this.classicLog = '';
    this.signalAdding.set(false);
    this.wakeCount.set(0);
  }
}
