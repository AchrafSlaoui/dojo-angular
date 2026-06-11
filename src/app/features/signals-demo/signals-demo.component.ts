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
import { ModelAmountComponent } from './model-amount/model-amount.component';

@Component({
  selector: 'app-signals-demo',
  standalone: true,
  imports: [BalanceCardComponent, ModelAmountComponent],
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

  // model()
  readonly targetAmount = signal(500);

  // References rapides pour les primitives avancees citees dans les slides :
  // - untracked(() => this.balance()) : lire un signal sans creer de dependance reactive.
  // - signal.asReadonly() : exposer un signal interne sans donner acces a .set() / .update().
  // - viewChildren(ClientCardComponent) : recuperer toutes les instances rendues sous forme de Signal<readonly T[]>.
  // - effect((onCleanup) => { onCleanup(() => cleanup()); }) : liberer timer, listener ou subscription.
  // - afterRender(() => measureDom()) : executer une mesure DOM apres chaque rendu Angular.
}
