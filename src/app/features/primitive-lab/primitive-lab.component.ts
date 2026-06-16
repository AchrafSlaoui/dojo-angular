import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComputedLabCardComponent } from './components/computed-lab-card/computed-lab-card.component';
import { EffectLabCardComponent } from './components/effect-lab-card/effect-lab-card.component';
import { InputLabCardComponent } from './components/input-lab-card/input-lab-card.component';
import { LinkedSignalLabCardComponent } from './components/linked-signal-lab-card/linked-signal-lab-card.component';
import { SignalLabCardComponent } from './components/signal-lab-card/signal-lab-card.component';

@Component({
  selector: 'app-primitive-lab',
  standalone: true,
  imports: [
    SignalLabCardComponent,
    ComputedLabCardComponent,
    EffectLabCardComponent,
    InputLabCardComponent,
    LinkedSignalLabCardComponent,
  ],
  templateUrl: './primitive-lab.component.html',
  styleUrl: './primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimitiveLabComponent {}
