import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { BalanceCardComponent } from './balance-card/balance-card.component';

@Component({
  selector: 'app-signals-demo',
  standalone: true,
  imports: [BalanceCardComponent],
  templateUrl: './signals-demo.component.html',
  styleUrl: './signals-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalsDemoComponent {

  // ── signal() ────────────────────────────────────────────
  readonly balance = signal(1000);

  // ── computed() ──────────────────────────────────────────
  readonly fees = computed(() => this.balance() * 0.02);        // ← breakpoint
  readonly net  = computed(() => this.balance() - this.fees()); // ← breakpoint

  // ── effect() ────────────────────────────────────────────
  readonly changeLog = signal<string[]>([]);

  constructor() {
    effect(() => {
      const b = this.balance();
      const time = new Date().toLocaleTimeString();
      this.changeLog.update(log => [...log.slice(-4), `${time}  →  ${b} €`]);
    });
  }

  // ── viewChild() ─────────────────────────────────────────
  private readonly amountInput = viewChild<ElementRef>('amountRef');

  focusInput(): void {
    this.amountInput()?.nativeElement.focus();
  }

  // ── toSignal() ──────────────────────────────────────────
  // Observable interval(1000) → signal mis à jour chaque seconde
  // Abonnement géré automatiquement par toSignal()
  readonly tick = toSignal(interval(1000), { initialValue: 0 });

  // ── output() : réaction à l'événement enfant ────────────
  onResetRequested(): void {
    this.balance.set(0);
  }
}
