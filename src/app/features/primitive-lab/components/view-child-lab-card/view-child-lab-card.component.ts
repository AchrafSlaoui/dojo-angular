import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { PrimitiveLabItemComponent } from '../primitive-lab-item/primitive-lab-item.component';

@Component({
  selector: 'app-view-child-lab-card',
  standalone: true,
  imports: [PrimitiveLabItemComponent],
  templateUrl: './view-child-lab-card.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewChildLabCardComponent {
  classicShowInput = false;
  @ViewChild('classicField') private classicField?: ElementRef<HTMLInputElement>;

  readonly signalShowInput = signal(false);
  private readonly signalField = viewChild<ElementRef<HTMLInputElement>>('signalField');

  readonly classicFocusStatus = signal<'none' | 'failed' | 'success'>('none');
  readonly signalFocusStatus = signal<'none' | 'applied'>('none');

  constructor() {
    effect(() => {
      const field = this.signalField();
      if (!this.signalShowInput() || !field) return;
      field.nativeElement.focus();
      this.signalFocusStatus.set('applied');
    });
  }

  showClassicInputAndFocus(): void {
    this.classicShowInput = true;
    if (this.classicField) {
      this.classicField.nativeElement.focus();
      this.classicFocusStatus.set('success');
    } else {
      this.classicFocusStatus.set('failed');
    }
  }

  showSignalInputAndFocus(): void {
    this.signalFocusStatus.set('none');
    this.signalShowInput.set(true);
  }

  reset(): void {
    this.classicShowInput = false;
    this.signalShowInput.set(false);
    this.classicFocusStatus.set('none');
    this.signalFocusStatus.set('none');
  }
}
