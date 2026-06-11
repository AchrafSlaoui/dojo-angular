import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AfterRenderLabCardComponent } from './components/after-render-lab-card/after-render-lab-card.component';
import { ComputedLabCardComponent } from './components/computed-lab-card/computed-lab-card.component';
import { EffectLabCardComponent } from './components/effect-lab-card/effect-lab-card.component';
import { InputLabCardComponent } from './components/input-lab-card/input-lab-card.component';
import { LinkedSignalLabCardComponent } from './components/linked-signal-lab-card/linked-signal-lab-card.component';
import { SignalLabCardComponent } from './components/signal-lab-card/signal-lab-card.component';
import { ViewChildLabCardComponent } from './components/view-child-lab-card/view-child-lab-card.component';
import { ZoneComputedLabCardComponent } from './components/zone-computed-lab-card/zone-computed-lab-card.component';

@Component({
  selector: 'app-primitive-lab',
  standalone: true,
  imports: [
    SignalLabCardComponent,
    ComputedLabCardComponent,
    EffectLabCardComponent,
    ViewChildLabCardComponent,
    InputLabCardComponent,
    LinkedSignalLabCardComponent,
    AfterRenderLabCardComponent,
    ZoneComputedLabCardComponent,
  ],
  templateUrl: './primitive-lab.component.html',
  styleUrl: './primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimitiveLabComponent {}
