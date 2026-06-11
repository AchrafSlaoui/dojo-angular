import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, map, skip, tap } from 'rxjs';
import { PrimitiveLabItemComponent } from '../primitive-lab-item/primitive-lab-item.component';

@Component({
  selector: 'app-interop-lab-card',
  standalone: true,
  imports: [FormsModule, PrimitiveLabItemComponent],
  templateUrl: './interop-lab-card.component.html',
  styleUrl: '../../primitive-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropLabCardComponent {
  readonly search = signal('');
  readonly instantCount = signal(0);
  readonly debouncedCount = signal(0);

  readonly debouncedSearch = toSignal(
    toObservable(this.search).pipe(
      skip(1),
      tap(() => this.instantCount.update(n => n + 1)),
      debounceTime(500),
      tap(() => this.debouncedCount.update(n => n + 1)),
      map(value => value.trim() || ''),
    ),
    { initialValue: '' },
  );
}
