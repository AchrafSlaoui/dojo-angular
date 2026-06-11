import {
  afterNextRender,
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, delay, interval, map, of } from 'rxjs';
import { BalanceCardComponent } from './balance-card/balance-card.component';
import { ModelAmountComponent } from './model-amount/model-amount.component';

type CreditProfile = 'standard' | 'premium';
type AccountFilter = 'all' | 'active' | 'blocked';

type DemoAccount = {
  id: number;
  label: string;
  status: 'active' | 'blocked';
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: 1, label: 'Compte courant', status: 'active' },
  { id: 2, label: 'Livret projet', status: 'active' },
  { id: 3, label: 'Compte bloque', status: 'blocked' },
];

@Component({
  selector: 'app-signals-demo',
  standalone: true,
  imports: [BalanceCardComponent, ModelAmountComponent],
  templateUrl: './signals-demo.component.html',
  styleUrl: './signals-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalsDemoComponent {
  private readonly injector = inject(Injector);

  // signal()
  // Primitive Signal writable : etat local modifiable par set() / update().
  readonly balance = signal(1000);

  // computed()
  // Primitive Signal read-only : valeur derivee pure et memorisee.
  readonly fees = computed(() => this.balance() * 0.02);
  readonly net  = computed(() => this.balance() - this.fees());

  // signal.asReadonly()
  // L'etat reste writable dans le composant, mais le template ne voit qu'un signal en lecture seule.
  private readonly auditState = signal<string[]>(['Demo initialise']);
  readonly auditLog = this.auditState.asReadonly();

  // effect() + untracked()
  // L'effet depend de balance(). targetAmount() est lu sans devenir une dependance.
  readonly changeLog = signal<string[]>([]);

  // effect(onCleanup)
  // Le timer existe uniquement quand cleanupWatcherEnabled() vaut true.
  readonly cleanupWatcherEnabled = signal(false);
  readonly cleanupTicks = signal(0);

  // linkedSignal()
  // Quand creditProfile change, editableLimit est reinitialise depuis defaultLimit.
  // Entre deux changements de profil, editableLimit reste modifiable localement.
  readonly creditProfile = signal<CreditProfile>('standard');
  readonly defaultLimit = computed<number>(() => this.creditProfile() === 'premium' ? 5000 : 2000);
  readonly editableLimit = linkedSignal<number>(() => this.defaultLimit());

  // toSignal()
  // Observable interval(1000) -> signal mis a jour chaque seconde.
  readonly tick = toSignal(interval(1000), { initialValue: 0 });

  // toObservable()
  // Signal -> Observable pour appliquer des operateurs RxJS, puis retour en signal pour le template.
  readonly debouncedBalance = toSignal(
    toObservable(this.balance).pipe(
      debounceTime(350),
      map(value => `${value} EUR apres debounce`),
    ),
    { initialValue: 'En attente de changement' },
  );

  // viewChild()
  // Reference DOM exposee comme signal. undefined tant que l'element n'est pas dans la vue.
  private readonly amountInput = viewChild<ElementRef<HTMLInputElement>>('amountRef');

  // viewChild() + afterEveryRender()
  // Mesure recurrente apres rendu. L'ecriture est conditionnelle pour eviter une boucle de rendu.
  private readonly demoRoot = viewChild<ElementRef<HTMLElement>>('demoRoot');
  private readonly renderWidthState = signal(0);
  readonly renderWidth = this.renderWidthState.asReadonly();

  // afterNextRender()
  // Callback one-shot apres le prochain rendu Angular.
  private readonly nextRenderBox = viewChild<ElementRef<HTMLElement>>('nextRenderBox');
  readonly nextRenderVisible = signal(false);
  readonly nextRenderMessage = signal('Aucun rendu planifie');

  // viewChildren()
  // Liste reactive des cartes presentes dans la vue.
  readonly demoCards = viewChildren<ElementRef<HTMLElement>>('demoCard');
  readonly demoCardCount = computed(() => this.demoCards().length);

  // rxResource()
  // API experimentale : meme modele que resource(), mais la lecture async vient d'un Observable RxJS.
  readonly accountFilter = signal<AccountFilter>('all');
  readonly accountsResource = rxResource<DemoAccount[], AccountFilter>({
    params: () => this.accountFilter(),
    stream: ({ params }) => of(DEMO_ACCOUNTS).pipe(
      delay(450),
      map(accounts => params === 'all' ? accounts : accounts.filter(account => account.status === params)),
    ),
    defaultValue: [],
  });

  constructor() {
    effect(() => {
      const b = this.balance();
      const targetSnapshot = untracked(() => this.targetAmount());
      const time = new Date().toLocaleTimeString();
      this.changeLog.update(log => [
        ...log.slice(-4),
        `${time} -> balance=${b} EUR, target non suivi=${targetSnapshot} EUR`,
      ]);
    });

    effect((onCleanup) => {
      if (!this.cleanupWatcherEnabled()) return;

      const timer = window.setInterval(() => {
        this.cleanupTicks.update(value => value + 1);
      }, 1000);

      onCleanup(() => window.clearInterval(timer));
    });

    afterEveryRender(() => {
      const width = Math.round(this.demoRoot()?.nativeElement.getBoundingClientRect().width ?? 0);
      if (width !== this.renderWidthState()) {
        this.renderWidthState.set(width);
      }
    });
  }

  focusInput(): void {
    this.amountInput()?.nativeElement.focus();
  }

  onResetRequested(): void {
    this.balance.set(0);
    this.auditState.update(log => [...log.slice(-3), 'Reset demande par output()']);
  }

  updateBalance(value: string): void {
    const nextValue = Number(value);
    if (Number.isFinite(nextValue)) {
      this.balance.set(nextValue);
    }
  }

  selectProfile(profile: CreditProfile): void {
    this.creditProfile.set(profile);
    this.auditState.update(log => [...log.slice(-3), `Profil ${profile} selectionne`]);
  }

  showAfterNextRenderBox(): void {
    this.nextRenderVisible.set(true);
    this.nextRenderMessage.set('Rendu demande, mesure en attente...');

    afterNextRender(() => {
      const height = Math.round(this.nextRenderBox()?.nativeElement.getBoundingClientRect().height ?? 0);
      this.nextRenderMessage.set(`afterNextRender execute une seule fois, hauteur mesuree=${height}px`);
    }, { injector: this.injector });
  }

  hideAfterNextRenderBox(): void {
    this.nextRenderVisible.set(false);
    this.nextRenderMessage.set('Bloc masque');
  }

  selectAccountFilter(filter: AccountFilter): void {
    this.accountFilter.set(filter);
  }

  readonly targetAmount = signal(500);
}
