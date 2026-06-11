import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { PrimitiveLabItemComponent } from '../primitive-lab-item/primitive-lab-item.component';

@Component({
  selector: 'app-after-render-lab-card',
  standalone: true,
  imports: [PrimitiveLabItemComponent],
  templateUrl: './after-render-lab-card.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AfterRenderLabCardComponent {
  private readonly injector = inject(Injector);

  readonly renderPanelVisible = signal(false);
  private readonly renderPanel = viewChild<ElementRef<HTMLElement>>('renderPanel');
  readonly immediateMeasure = signal('Aucune mesure');
  readonly afterRenderMeasure = signal('Aucune mesure');

  showPanelAndMeasure(): void {
    this.renderPanelVisible.set(true);
    this.immediateMeasure.set(
      this.renderPanel()
        ? `Mesure immediate : ${Math.round(this.renderPanel()!.nativeElement.getBoundingClientRect().height)}px`
        : 'Mesure immediate : panneau absent',
    );

    afterNextRender(() => {
      const height = Math.round(this.renderPanel()?.nativeElement.getBoundingClientRect().height ?? 0);
      this.afterRenderMeasure.set(`afterNextRender : ${height}px`);
    }, { injector: this.injector });
  }

  hidePanel(): void {
    this.renderPanelVisible.set(false);
    this.immediateMeasure.set('Aucune mesure');
    this.afterRenderMeasure.set('Aucune mesure');
  }
}
