# Dojo Angular Signals - 4h

Objectif: utiliser l'application clients/comptes existante comme support de dojo. Chaque etape part d'un exemple deja present dans le projet, puis propose un changement a faire dans le code avec un avant/apres attendu.

Contraintes du dojo:

- pas de pause planifiee;
- pas de composant abstrait cree uniquement pour montrer les Signals;
- chaque exercice doit rester dans le domaine clients/comptes;
- chaque changement doit pouvoir etre teste avec Jest ou verifie dans l'ecran existant.

## Deroulement global

| Temps | Sujet | Fichiers principaux |
| --- | --- | --- |
| 0:00 - 0:15 | Lecture fonctionnelle de l'app | `src/app/app.routes.ts`, `src/app/features/clients/pages/clients/clients.component.html` |
| 0:15 - 0:45 | `signal()` pour l'etat local | `src/app/features/clients/pages/clients/clients.component.ts` |
| 0:45 - 1:15 | `computed()` pour l'etat derive | `src/app/features/accounts/services/accounts.facade.ts` |
| 1:15 - 1:45 | `input()` dans un composant existant | `src/app/features/accounts/components/account-card/account-card.component.ts` |
| 1:45 - 2:15 | `output()` dans un composant existant | `src/app/features/accounts/components/account-list/account-list.component.ts` |
| 2:15 - 3:00 | Interop Signals / RxJS (`toSignal` + `toObservable`) | `src/app/features/accounts/pages/accounts/accounts.component.ts`, `src/app/features/clients/pages/dashboard/dashboard.component.ts`, `src/app/features/clients/pages/clients/clients.component.ts` |
| 3:00 - 3:30 | `effect()` + `viewChild()` | `src/app/features/clients/pages/clients/clients.component.ts` |
| 3:30 - 3:50 | Refactoring guide | `src/app/features/accounts/services/accounts.facade.ts` |
| 3:50 - 4:00 | Debrief et option Angular recent | Toute l'app |

## 0:00 - 0:15 - Lecture fonctionnelle de l'app

But: comprendre le terrain avant de coder.

Exemples existants a lire:

- `src/app/app.routes.ts`: routes `dashboard`, `clients`, detail client, comptes client, detail compte.
- `src/app/features/clients/pages/clients/clients.component.html`: liste, recherche, ajout, pagination, suppression.
- `src/app/features/accounts/pages/accounts/accounts.component.html`: filtres comptes, total affiche, formulaire d'ajout, liste.

Ce qu'il faut faire:

1. Lancer les tests existants:

```bash
npm test
```

2. Identifier les flux:

- page clients -> `ClientsComponent`;
- carte client -> `ClientCardComponent`;
- page comptes -> `AccountsComponent`;
- facade comptes -> `AccountsFacade`;
- liste/cartes comptes -> `AccountListComponent` / `AccountCardComponent`.

Etat attendu apres cette etape:

- le groupe sait ou se trouvent les exemples de `signal`, `computed`, `input`, `output`, `toSignal` et `effect`;
- aucun code n'est encore modifie.

## 0:15 - 0:45 - Exercice 1: transformer un etat UI en `signal()`

Notion: un signal represente un etat local mutable. On le lit avec `()` et on le modifie avec `.set()` ou `.update()`.

Exemple existant a referencer:

`src/app/features/clients/pages/clients/clients.component.ts`

```ts
readonly search = signal('');
readonly page = signal(1);
readonly loading = signal(false);
readonly mutating = signal(false);
readonly error = signal<string | null>(null);
```

Exercice: convertir l'etat `adding` de `ClientsComponent` en signal.

Avant:

```ts
adding = false;

startAdd(): void {
  this.adding = true;
  this.newClient = { firstName: '', lastName: '', email: '', phone: '', address: '' };
}

cancelAdd(): void {
  this.adding = false;
}
```

Dans le template:

```html
@if (!adding) {
  <button class="icon-btn plus" (click)="startAdd()" title="Ajouter un client" aria-label="Ajouter">
    <span class="icon i-plus icon-lg"></span>
  </button>
}

@if (adding) {
  <form class="add-client card" (ngSubmit)="saveAdd()">
```

Apres:

```ts
readonly adding = signal(false);

startAdd(): void {
  this.adding.set(true);
  this.newClient = { firstName: '', lastName: '', email: '', phone: '', address: '' };
}

cancelAdd(): void {
  this.adding.set(false);
}
```

Dans `saveAdd()`, remplacer aussi:

```ts
this.adding = false;
```

par:

```ts
this.adding.set(false);
```

Dans le template:

```html
@if (!adding()) {
  <button class="icon-btn plus" (click)="startAdd()" title="Ajouter un client" aria-label="Ajouter">
    <span class="icon i-plus icon-lg"></span>
  </button>
}

@if (adding()) {
  <form class="add-client card" (ngSubmit)="saveAdd()">
```

Verification:

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts
```

Point a faire verbaliser:

- pourquoi `loading`, `mutating`, `error` et `adding` sont de bons candidats pour `signal()`;
- pourquoi `newClient` peut rester un objet simple pour cet exercice.

## Rappel avant exercice 2 - Lire un `computed()`

Un `computed()` est une valeur derivee a partir d'autres signals. Angular memorise sa derniere valeur et ne relance le calcul que lorsqu'une dependance lue dans le `computed()` change.

Exemple existant simple dans `src/app/features/accounts/components/account-card/account-card.component.ts`:

```ts
readonly statusLabel = computed(() => {
  switch (this.account().status) {
    case 'active':
      return 'Actif';
    case 'blocked':
      return 'Bloque';
    case 'closed':
      return 'Cloture';
  }
});
```

Lecture:

- `this.account()` est un input signal;
- `statusLabel` depend de `account()`;
- si `account()` change, Angular invalide `statusLabel`;
- dans le template, on lit `statusLabel()`.

Exemple existant plus metier dans `src/app/features/accounts/services/accounts.facade.ts`:

```ts
readonly filteredAccounts = computed(() =>
  this.filterAccounts(this.accountsState(), this.search(), this.typeFilter())
);
```

Lecture:

- `filteredAccounts` depend de `accountsState()`, `search()` et `typeFilter()`;
- le filtre est recalcule quand une de ces trois valeurs change;
- le composant consomme directement `accountsFacade.filteredAccounts`.

Comparaison utile pour l'exercice 2:

```ts
get blockedAccountsCount(): number {
  return this.accounts().filter((account) => account.status === 'blocked').length;
}
```

Ce getter fonctionne, mais il reste une lecture imperative dans le composant. Il est recalcule a chaque lecture et la regle n'est pas exposee comme etat derive partageable.

```ts
readonly blockedAccountsCount = computed(() =>
  this.filteredAccounts().filter((account) => account.status === 'blocked').length
);
```

Ici, le compteur devient une valeur derivee du modele d'etat de la facade. Il est coherent avec `filteredAccounts()`, reutilisable par le composant, et testable comme regle metier.

## 0:45 - 1:15 - Exercice 2: transformer un calcul classique en `computed()`

Notion: un `computed()` remplace un calcul derive que l'on ferait sinon avec un getter ou une propriete mise a jour manuellement. La valeur se recalcule automatiquement quand les signals lus changent.

Exemples existants a referencer:

`src/app/features/clients/pages/clients/clients.component.ts`

```ts
readonly totalClients = computed(() => this.pageSlice().total);
readonly totalPages = computed(() => this.pageSlice().totalPages);
readonly useVirtualScroll = computed(() => this.totalClients() > 100);
```

`src/app/features/accounts/services/accounts.facade.ts`

```ts
readonly filteredAccounts = computed(() =>
  this.filterAccounts(this.accountsState(), this.search(), this.typeFilter())
);
readonly totalBalance = computed(() =>
  Math.round(this.filteredAccounts().reduce((total, account) => total + account.balance, 0) * 100) / 100
);
```

Preparation deja faite dans le projet: le nombre de comptes bloques est deja affiche avec un getter classique dans `AccountsComponent`. Le dojo consiste a transformer ce calcul local en `computed()` expose par `AccountsFacade`.

### Etat prepare avant le dojo - Getter classique

Dans `AccountsFacade`, le compteur est une propriete calculee classique:

```ts
get blockedAccountsCount(): number {
  return this.filteredAccounts().filter((account) => account.status === 'blocked').length;
}
```

Dans `AccountsComponent`, un getter relaie la valeur exposee par la facade:

```ts
get blockedAccountsCount(): number {
  return this.accountsFacade.blockedAccountsCount;
}
```

Dans `accounts.component.html`, le template lit une propriete TypeScript:

```html
<div class="header-actions">
  <strong>Total affiche: {{ totalBalance() | formatValue:"currency" }}</strong>
  <strong>Bloques: {{ blockedAccountsCount }}</strong>
</div>
```

Dans `accounts.component.spec.ts`, un compte de test est deja bloque:

```ts
{ id: 'a2', clientId: 'c1', label: 'Livret Ada', type: 'saving', status: 'blocked', balance: 250, currency: 'EUR', movements: [] },
```

Le test verifie la valeur du getter:

```ts
expect(fixture.componentInstance.blockedAccountsCount).toBe(1);
```

Ce que cet etat prepare montre:

- le getter fonctionne;
- il depend implicitement de `filteredAccounts()`;
- la regle metier est deja dans la facade, mais pas encore dans le modele signal;
- le template ne lit pas une valeur signal avec `()`, mais une propriete TypeScript classique.

### Exercice - Transformer le getter en `computed()`

Avant dans `AccountsFacade`:

```ts
readonly totalBalance = computed(() =>
  Math.round(this.filteredAccounts().reduce((total, account) => total + account.balance, 0) * 100) / 100
);
```

Apres dans `AccountsFacade`:

```ts
readonly blockedAccountsCount = computed(() =>
  this.filteredAccounts().filter((account) => account.status === 'blocked').length
);
```

Avant dans `AccountsFacade`, remplacer le getter:

```ts
get blockedAccountsCount(): number {
  return this.filteredAccounts().filter((account) => account.status === 'blocked').length;
}
```

Avant dans `AccountsComponent`, remplacer le getter relais:

```ts
get blockedAccountsCount(): number {
  return this.accountsFacade.blockedAccountsCount;
}
```

Puis exposer directement le `computed()` de la facade:

```ts
readonly blockedAccountsCount = this.accountsFacade.blockedAccountsCount;
```

Avant dans `accounts.component.html`, la version getter:

```html
<div class="header-actions">
  <strong>Total affiche: {{ totalBalance() | formatValue:"currency" }}</strong>
  <strong>Bloques: {{ blockedAccountsCount }}</strong>
</div>
```

Apres, la version signal derive:

```html
<div class="header-actions">
  <strong>Total affiche: {{ totalBalance() | formatValue:"currency" }}</strong>
  <strong>Bloques: {{ blockedAccountsCount() }}</strong>
</div>
```

Dans le test, transformer l'assertion du getter en lecture de signal:

```ts
expect(fixture.componentInstance.blockedAccountsCount()).toBe(1);
```

Commande:

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

Point a faire verbaliser:

- la version getter est acceptable pour un petit calcul local, mais elle garde la regle dans le composant;
- la version `computed()` rend la valeur explicite dans le modele reactif;
- `blockedAccountsCount` depend de `filteredAccounts()`, donc le compteur suit aussi la recherche et le filtre de type;
- un `computed()` ne fait pas d'appel HTTP et ne declenche pas de mutation.

## 1:15 - 1:45 - Exercice 3: transformer un `@Input()` classique en `input()`

Notion: `input()` declare une entree de composant sous forme de signal. Pour comprendre la transformation, on part d'abord d'un `@Input()` classique.

Exemples existants a referencer:

`src/app/features/clients/components/client-card/client-card.component.ts`

```ts
client = input.required<Client>();
editable = input(false);
```

`src/app/features/accounts/components/account-card/account-card.component.ts`

```ts
account = input.required<Account>();
clientId = input.required<string>();
```

Preparation deja faite dans le projet: un input classique `showStatus` a ete ajoute a `AccountCardComponent`. Il sert a masquer ou afficher le statut du compte depuis la liste, mais il est maintenant lu dans un `computed()` pour montrer la limite d'un `@Input()` classique dans un graphe signal.

### Etat prepare avant le dojo - `showStatus` sans signal

Dans `AccountCardComponent`, l'import contient `Input`:

```ts
import { ChangeDetectionStrategy, Component, Input, computed, input } from '@angular/core';
```

Le composant contient un input classique:

```ts
account = input.required<Account>();
clientId = input.required<string>();

@Input() showStatus = true;

readonly visibleStatusLabel = computed(() => this.showStatus ? this.statusLabel() : null);
```

Dans `account-card.component.html`, le template lit le `computed()`:

```html
@if (visibleStatusLabel(); as label) {
  <div class="meta">
    <span>{{ label }}</span>
    <span></span>
  </div>
}
```

Dans `account-list.component.html`, le parent passe explicitement la valeur:

```html
<app-account-card [account]="account" [clientId]="clientId()" [showStatus]="true"></app-account-card>
```

Ce que cet etat prepare montre:

- `@Input()` fonctionne toujours;
- `showStatus` peut etre lu dans un `computed()`, mais cette lecture n'est pas une dependance signal;
- le `computed()` suit bien `account()`, mais pas les changements de `showStatus` tant que `showStatus` reste un `@Input()` classique.

### Exercice - Transformer `@Input()` en `input()`

Avant dans `AccountCardComponent`:

```ts
import { ChangeDetectionStrategy, Component, Input, computed, input } from '@angular/core';
```

Apres, retirer `Input`:

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
```

Avant:

```ts
@Input() showStatus = true;

readonly visibleStatusLabel = computed(() => this.showStatus ? this.statusLabel() : null);
```

Apres:

```ts
showStatus = input(true);

readonly visibleStatusLabel = computed(() => this.showStatus() ? this.statusLabel() : null);
```

Dans `account-card.component.html`, la lecture du `computed()` ne change pas:

```html
@if (visibleStatusLabel(); as label) {
  <div class="meta">
    <span>{{ label }}</span>
    <span></span>
  </div>
}
```

Dans `account-list.component.html`, l'appel parent ne change pas:

```html
<app-account-card [account]="account" [clientId]="clientId()" [showStatus]="true"></app-account-card>
```

Variante d'exercice:

- mettre `[showStatus]="editingAccountId() !== account.id"` si le groupe veut discuter d'un input derive depuis l'etat parent.

Verification:

```bash
npm test -- --runTestsByPath src/app/features/accounts/components/account-card/account-card.component.spec.ts
```

Point a faire verbaliser:

- dans le TypeScript, un input signal se lit avec `showStatus()`;
- une dependance lue dans un `computed()` doit etre un signal pour invalider correctement le calcul;
- `input(true)` donne une valeur par defaut, contrairement a `input.required<T>()`.

## 1:45 - 2:15 - Exercice 4: transformer un `@Output()` classique en `output()`

Notion: `output()` remplace un evenement de composant declare avec `@Output()` et `EventEmitter`. L'enfant emet une intention, le parent decide quoi faire.

Exemples existants a referencer:

`src/app/features/clients/components/client-card/client-card.component.ts`

```ts
deleteRequested = output<Client>();
saveRequested = output<ClientUpdate>();
```

`src/app/features/accounts/components/account-list/account-list.component.ts`

```ts
editRequested = output<Account>();
saveRequested = output<void>();
cancelRequested = output<void>();
deleteRequested = output<Account>();
```

Preparation deja faite dans le projet: un output classique `selectedRequested` a ete ajoute a `AccountListComponent`. Il est emis quand l'utilisateur active l'action de modification d'un compte. Pour ajouter un cas un peu plus riche, le clic alimente maintenant un signal local, puis un `effect()` emet l'output.

### Etat prepare avant le dojo - `selectedRequested` sans signal

Dans `AccountListComponent`, l'import contient encore `EventEmitter` et `Output`, ainsi que `effect` et `signal`:

```ts
import { ChangeDetectionStrategy, Component, EventEmitter, Output, effect, input, output, signal } from '@angular/core';
```

Le composant contient un output classique:

```ts
editRequested = output<Account>();
saveRequested = output<void>();
cancelRequested = output<void>();
deleteRequested = output<Account>();

@Output() selectedRequested = new EventEmitter<Account>();
```

Le clic ne fait plus l'emission directement. Il passe par une intention locale:

```html
<button
  class="icon-btn lg"
  type="button"
  title="Modifier le compte"
  aria-label="Modifier le compte"
  (click)="requestEdit(account)"
  [disabled]="mutating()"
>
  <span class="icon i-edit icon-lg"></span>
</button>
```

Le composant transforme ensuite ce signal local en output:

```ts
private readonly selectedAccount = signal<Account | null>(null, { equal: () => false });

constructor() {
  effect(() => {
    const account = this.selectedAccount();
    if (account) {
      this.selectedRequested.emit(account);
    }
  });
}

requestEdit(account: Account): void {
  this.selectedAccount.set(account);
  this.editRequested.emit(account);
}
```

Ce que cet etat prepare montre:

- `@Output()` fonctionne toujours;
- `EventEmitter` impose une API differente de `output()`;
- emettre un output depuis un `effect()` est un effet de bord explicite;
- l'evenement est une intention emise par l'enfant, pas une action metier executee dans l'enfant.

### Exercice - Transformer `@Output()` en `output()`

Avant dans `account-list.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, EventEmitter, Output, effect, input, output, signal } from '@angular/core';
```

Apres, retirer `EventEmitter` et `Output`, mais garder `effect` et `signal`:

```ts
import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
```

Avant:

```ts
@Output() selectedRequested = new EventEmitter<Account>();
```

Apres:

```ts
selectedRequested = output<Account>();
```

Dans l'`effect()`, l'emission ne change pas:

```ts
this.selectedRequested.emit(account);
```

Dans `account-list.component.html`, le clic continue de passer par la methode:

```html
(click)="requestEdit(account)"
```

Option si on veut suivre l'evenement jusqu'au parent:

Dans `accounts.component.html`, ajouter temporairement l'ecoute:

```html
<app-account-list
  [accounts]="accounts()"
  [clientId]="clientId() ?? ''"
  [mutating]="mutating()"
  [editingAccountId]="editingAccountId"
  [editAccount]="editAccount"
  (editRequested)="startEdit($event)"
  (saveRequested)="saveEdit()"
  (cancelRequested)="cancelEdit()"
  (deleteRequested)="deleteAccount($event)"
  (selectedRequested)="startEdit($event)"
></app-account-list>
```

Attention pendant le dojo:

- on n'ajoute pas l'evenement sur toute la carte compte, car la carte est deja un lien vers le detail;
- l'exercice doit conserver la navigation existante.

Verification:

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

Point a faire verbaliser:

- l'enfant ne connait pas `AccountsFacade`;
- l'enfant expose une intention, le parent orchestre l'action.
- `output()` ne rend pas l'evenement observable comme un signal; ici le signal local sert uniquement a declencher l'effet.

## 2:15 - 3:00 - Exercice 5: interop RxJS ↔ Signals (`toSignal` + `toObservable`)

Notion: tout ne devient pas signal. Certaines APIs Angular exposent encore des Observables. `toSignal()` sert de pont pour exposer la derniere valeur d'un Observable sous forme de signal.

### Partie 1 - Transformer `route.paramMap` vers `toSignal()`

Preparation deja faite dans le projet: `AccountsComponent` utilise une souscription RxJS explicite a `route.paramMap`, puis copie la valeur dans un signal manuel `clientId`.

Exemple deja present dans le fichier: `initialTypeFilter` utilise deja `toSignal()` pour lire un query param - lire cette propriete avant de commencer l'exercice.

#### Etat prepare avant le dojo - Observable + souscription manuelle

```ts
import { ChangeDetectionStrategy, Component, DestroyRef, Signal, inject, signal } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
```

```ts
private readonly route = inject(ActivatedRoute);
private readonly destroyRef = inject(DestroyRef);
private readonly accountsFacade = inject(AccountsFacade);
private readonly clientId$ = this.route.paramMap.pipe(map((params) => params.get('id')));
private readonly initialTypeFilter: Signal<string> = toSignal(
  this.route.queryParamMap.pipe(map((params) => params.get('type') ?? 'all')),
  { initialValue: 'all' }
);

readonly clientId = signal<string | null>(null);
```

```ts
constructor() {
  this.accountsFacade.setTypeFilter(this.initialTypeFilter());
  this.clientId$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((clientId) => {
      this.clientId.set(clientId);
      this.accountsFacade.load(clientId);
    });
}
```

Ce que cet etat prepare montre:

- `paramMap` reste un Observable;
- on doit gerer la souscription;
- on doit injecter `DestroyRef`;
- on copie manuellement la valeur Observable dans un signal local;
- `initialTypeFilter` montre deja la syntaxe `toSignal()` dans ce meme fichier.

#### Exercice - Transformer vers `toSignal()`

Avant:

```ts
import { ChangeDetectionStrategy, Component, DestroyRef, Signal, inject, signal } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
```

Apres, retirer `DestroyRef` et `takeUntilDestroyed`, ajouter `effect`:

```ts
import { ChangeDetectionStrategy, Component, Signal, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
```

Avant:

```ts
private readonly destroyRef = inject(DestroyRef);
private readonly clientId$ = this.route.paramMap.pipe(map((params) => params.get('id')));

readonly clientId = signal<string | null>(null);
```

Apres:

```ts
readonly clientId: Signal<string | null> = toSignal(
  this.route.paramMap.pipe(map((params) => params.get('id'))),
  { initialValue: null }
);
```

Avant, la souscription fait deux choses: elle alimente `clientId` et elle charge les comptes.

```ts
constructor() {
  this.accountsFacade.setTypeFilter(this.initialTypeFilter());
  this.clientId$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((clientId) => {
      this.clientId.set(clientId);
      this.accountsFacade.load(clientId);
    });
}
```

Apres, `toSignal()` alimente `clientId`; le chargement est deplace dans un `effect()`:

```ts
constructor() {
  this.accountsFacade.setTypeFilter(this.initialTypeFilter());
  effect(() => {
    this.accountsFacade.load(this.clientId());
  });
}
```

Verification dans le template existant:

```html
<a class="back-link" [routerLink]="['/clients', clientId()]">Retour au client</a>
```

Verification test:

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

Point a faire verbaliser:

- `paramMap` reste un Observable;
- `toSignal()` evite la souscription manuelle;
- `clientId()` reste lisible comme un signal dans le composant et le template;
- l'appel API reste un effet de bord, donc il est deplace dans `effect()`.

### Partie 2 - Consommer un Observable HTTP expose par un service

Objectif: garder la responsabilite HTTP dans le service, exposer un `Observable`, puis convertir cet Observable en signal dans le composant.

Exemple deja present dans le fichier: `DashboardComponent` expose `searchFromRoute` qui utilise deja `toSignal()` pour lire le parametre `q` depuis l'URL - lire cette propriete avant de commencer l'exercice.

Le service expose deja une methode qui consomme HTTP:

`src/app/features/clients/services/clients-api.service.ts`

```ts
getAll(): Observable<ClientActivity[]> {
  return this.http.get<ClientActivity[]>('/api/clients');
}
```

Dans `DashboardComponent`, l'etat prepare avant transformation utilise une approche imperative avec `firstValueFrom()`:

`src/app/features/clients/pages/dashboard/dashboard.component.ts`

```ts
import { Component, ChangeDetectionStrategy, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
```

```ts
private readonly clientsApi = inject(ClientsApiService);
private readonly clientsState = signal<ClientActivity[]>([]);
readonly search = signal('');
readonly loading = signal(false);
readonly error = signal<string | null>(null);

weeklyClients: Signal<ClientActivity[]> = computed(() =>
  getWeeklyClients(this.clientsState(), this.search())
);

constructor() {
  this.reload();
}

async reload(): Promise<void> {
  this.loading.set(true);
  this.error.set(null);
  try {
    const data = await firstValueFrom(this.clientsApi.getAll());
    this.clientsState.set(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossible de charger les clients.';
    this.error.set(message);
    this.clientsState.set([]);
  } finally {
    this.loading.set(false);
  }
}
```

Ce que cet etat prepare montre:

- le service garde deja la responsabilite HTTP;
- `getAll()` retourne un `Observable<ClientActivity[]>`;
- le composant convertit manuellement cet Observable en Promise avec `firstValueFrom()`;
- `loading`, `error` et `clientsState` sont synchronises a la main.

#### Exercice - Remplacer `firstValueFrom()` par `toSignal()`

Avant dans les imports:

```ts
import { Component, ChangeDetectionStrategy, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
```

Apres:

```ts
import { Component, ChangeDetectionStrategy, Signal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith } from 'rxjs';
```

Ajouter un type local pour representer l'etat de la lecture HTTP:

```ts
type DashboardClientsQuery = {
  clients: ClientActivity[];
  loading: boolean;
  error: string | null;
};
```

Ajouter une valeur initiale:

```ts
const initialClientsQuery: DashboardClientsQuery = {
  clients: [],
  loading: true,
  error: null,
};
```

Remplacer `clientsState`, `loading`, `error`, le constructeur et `reload()` par un signal issu de l'Observable HTTP:

```ts
private readonly clientsQuery = toSignal(
  this.clientsApi.getAll().pipe(
    map((clients): DashboardClientsQuery => ({ clients, loading: false, error: null })),
    catchError((err) => {
      const message = err instanceof Error ? err.message : 'Impossible de charger les clients.';
      return of({ clients: [], loading: false, error: message });
    }),
    startWith(initialClientsQuery)
  ),
  { initialValue: initialClientsQuery }
);
```

Puis exposer les valeurs utiles avec des `computed()`:

```ts
readonly loading = computed(() => this.clientsQuery().loading);
readonly error = computed(() => this.clientsQuery().error);

weeklyClients: Signal<ClientActivity[]> = computed(() =>
  getWeeklyClients(this.clientsQuery().clients, this.search())
);
```

Le template existant continue de lire des signals:

```html
@if (loading()) {
  <div class="status">Chargement en cours...</div>
}
@if (error(); as message) {
  <div class="status error">{{ message }}</div>
}
```

Adapter le test d'erreur, car il n'y a plus de methode `reload()` a appeler. Avant:

```ts
api.getAll.mockReturnValueOnce(throwError(() => new Error('oops')));
await component.reload();
await fixture.whenStable();
expect(component.error()).toBe('oops');
```

Apres, creer le composant apres avoir prepare le mock:

```ts
it('surfaces loading and error state', async () => {
  api.getAll.mockReturnValueOnce(throwError(() => new Error('oops')));

  const errorFixture = TestBed.createComponent(DashboardComponent);
  errorFixture.detectChanges();
  await errorFixture.whenStable();

  expect(errorFixture.componentInstance.error()).toBe('oops');
});
```

Verification:

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/dashboard/dashboard.component.spec.ts
```

Point a faire verbaliser:

- le service expose un Observable HTTP, il ne devient pas un signal;
- le composant decide de convertir cet Observable avec `toSignal()`;
- RxJS reste utile pour preparer les etats `loading`, succes et erreur;
- `toSignal()` est cree une seule fois comme propriete du composant;
- ce pattern est adapte a une lecture HTTP, moins a une commande `POST`, `PUT` ou `DELETE`.

### Partie 3 - `toObservable()` : le pont dans l'autre sens

Notion: `toObservable()` est le miroir de `toSignal()`. Il expose la valeur courante d'un signal comme un Observable, ce qui permet de brancher des operateurs RxJS sur un etat signal.

Exemple deja present dans le fichier: `debouncedSearch$` dans `ClientsComponent` — lire cette propriete avant de commencer.

`src/app/features/clients/pages/clients/clients.component.ts`

```ts
readonly debouncedSearch$ = toObservable(this.search).pipe(debounceTime(300));
```

Ce que cet exemple montre:

- `search` est un signal, `debouncedSearch$` est un Observable;
- chaque fois que `search()` change, l'Observable emet la nouvelle valeur;
- `debounceTime(300)` ne peut pas s'exprimer avec `signal()` ou `computed()` seuls;
- `toObservable()` est le bon outil quand un operateur RxJS n'a pas d'equivalent signal.

Cas d'usage typiques de `toObservable()`:

- debounce sur un champ de recherche;
- combiner deux signals avec `combineLatest()`;
- partager un etat signal avec un service qui consomme des Observables.

Cet exercice est une demonstration, pas une transformation de code: le groupe lit `debouncedSearch$`, discute quand utiliser `toObservable()` vs rester dans le monde signal, et identifie deux autres candidats dans l'application.

Verification: aucun test a ecrire - verifier visuellement dans le template que la recherche fonctionne.

Point a faire verbaliser:

- `toSignal()` et `toObservable()` sont les deux directions du pont;
- choisir le bon sens depend de la nature de l'operation (RxJS reste meilleur pour le temps, la combinaison, le multicasting);
- ne pas bridger systematiquement: si tout est signal, rester signal.

## 3:00 - 3:30 - Exercice 6: `effect()` + `viewChild()`

Notion: `effect()` execute un effet de bord quand des signals changent. `viewChild()` expose un element du template comme un signal, ce qui permet de le lire dans un `effect()` ou un `computed()`.

### Partie 1 - Transformer une correction imperative en `effect()`

Preparation deja faite dans le projet: `ClientsComponent` corrige la pagination de maniere imperative apres suppression d'un client.

Exemples deja presents dans le fichier: le constructeur contient deux `effect()` a lire avant de commencer — `document.title` et l'auto-focus sur `firstNameInput`.

### Etat prepare avant le dojo - correction imperative

```ts
async deleteClient(client: Client): Promise<void> {
  // ...
  await firstValueFrom(this.clientsApi.remove(client.id));
  this.clientsState.update((list) => list.filter((c) => c.id !== client.id));
  this.clampCurrentPage();
  this.notifications.success('Client supprime.');
  // ...
}
```

```ts
private clampCurrentPage(): void {
  const clamped = this.pageSlice().page;
  if (clamped !== this.page()) {
    this.page.set(clamped);
  }
}
```

Ce que cet etat prepare montre:

- la correction fonctionne seulement si on pense a appeler `clampCurrentPage()`;
- la contrainte depend deja de `pageSlice()`;
- la logique est reactive dans les donnees, mais imperative dans le declenchement.

### Exercice - Transformer vers `effect()`

Avant dans l'import:

```ts
import { Component, ChangeDetectionStrategy, Signal, computed, inject, signal } from '@angular/core';
```

Apres, ajouter `effect`:

```ts
import { Component, ChangeDetectionStrategy, Signal, computed, effect, inject, signal } from '@angular/core';
```

Avant dans le constructeur:

```ts
constructor() {
  this.loadClients();
}
```

Apres:

```ts
constructor() {
  effect(() => {
    const clamped = this.pageSlice().page;
    if (clamped !== this.page()) {
      this.page.set(clamped);
    }
  });
  this.loadClients();
}
```

Avant dans `deleteClient()`:

```ts
this.clientsState.update((list) => list.filter((c) => c.id !== client.id));
this.clampCurrentPage();
this.notifications.success('Client supprime.');
```

Apres, supprimer l'appel explicite:

```ts
this.clientsState.update((list) => list.filter((c) => c.id !== client.id));
this.notifications.success('Client supprime.');
```

Puis supprimer la methode:

```ts
private clampCurrentPage(): void {
  const clamped = this.pageSlice().page;
  if (clamped !== this.page()) {
    this.page.set(clamped);
  }
}
```

Ce que la transformation montre:

- l'effet observe automatiquement `pageSlice()` et `page()`;
- la correction est appliquee quelle que soit la cause du changement: recherche, taille de page, chargement, suppression;
- la logique de correction n'est plus dispersee dans les methodes qui mutent la liste.

Avant dans `clients.component.spec.ts`, le test recherche verifie seulement le signal `search`:

```ts
expect((fixture.componentInstance as ClientsComponent).search()).toBe('Ada');
```

Apres, ajouter un test qui montre que la page revient dans une plage valide:

```ts
it('clamps the current page when the result set becomes smaller', () => {
  const component = fixture.componentInstance;

  component.onPageSizeChange('1');
  component.nextPage();
  component.setSearch('Ada');
  fixture.detectChanges();

  expect(component.page()).toBe(1);
});
```

Verification:

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts
```

Point a faire verbaliser:

- ici, l'effet ecrit dans `page` pour conserver un etat UI coherent;
- un total, un filtre ou un libelle doivent rester des `computed()`;
- un chargement HTTP declenche par une route est un effet de bord acceptable, mais il faut surveiller les appels multiples.

### Partie 2 - Auto-focus avec `viewChild()`

Notion: `viewChild()` remplace `@ViewChild()` en exposant la reference d'un element du template comme un signal. Sa valeur change automatiquement quand l'element apparait ou disparait du DOM.

Exemple deja present dans le fichier: `firstNameInput = viewChild<ElementRef>('firstNameRef')` est declare dans `ClientsComponent` avec un `effect()` de base — lire ces deux elements avant de commencer.

```ts
private readonly firstNameInput = viewChild<ElementRef>('firstNameRef');
```

```html
<input #firstNameRef type="text" [(ngModel)]="newClient.firstName" ... />
```

#### Etat prepare avant le dojo

```ts
constructor() {
  // ...
  effect(() => {
    this.firstNameInput()?.nativeElement.focus();
  });
  // ...
}
```

Ce que cet etat prepare montre:

- `firstNameInput()` retourne `undefined` quand le formulaire est masque, l'element DOM quand il est visible;
- l'effet actuel focus l'input a chaque changement de `firstNameInput()`, sans condition sur `adding()`;
- la valeur de `viewChild()` est un signal: quand le `@if` rend le DOM, le signal change, l'effet se re-execute.

#### Exercice - Conditionner le focus sur `adding()`

Avant:

```ts
effect(() => {
  this.firstNameInput()?.nativeElement.focus();
});
```

Apres:

```ts
effect(() => {
  if (this.adding()) {
    this.firstNameInput()?.nativeElement.focus();
  }
});
```

Ce que la transformation montre:

- lire `this.adding()` dans l'effet cree une dependance: l'effet se relance quand `adding()` change;
- lire `this.firstNameInput()` cree une seconde dependance: l'effet se relance quand le DOM change;
- les deux dependances doivent etre vraies simultanement pour que le focus se produise.

Verification: lancer l'app, cliquer "Ajouter un client", verifier que le curseur est dans le champ prenom.

Point a faire verbaliser:

- `viewChild()` signal ne fonctionne pas comme `@ViewChild()` classique dans un graphe signal;
- la valeur retournee est `Signal<ElementRef | undefined>`, pas un `ElementRef` direct;
- lire un `viewChild()` dans un `computed()` est egalement valide si la logique est pure.

## 3:30 - 3:50 - Exercice 7: refactoring guide dans une facade

Notion: une facade peut exposer des signals et computed pour isoler l'etat metier du composant.

Exemple existant a referencer:

`src/app/features/accounts/services/accounts.facade.ts`

```ts
readonly search = signal('');
readonly typeFilter = signal<AccountTypeFilter>('all');
readonly filteredAccounts = computed(() =>
  this.filterAccounts(this.accountsState(), this.search(), this.typeFilter())
);
```

Exercice: extraire une intention metier lisible: savoir si un filtre est actif.

Avant:

```ts
readonly typeFilter = signal<AccountTypeFilter>('all');
readonly loading = signal(false);
```

Apres:

```ts
readonly typeFilter = signal<AccountTypeFilter>('all');
readonly hasActiveFilter = computed(() =>
  this.search().trim().length > 0 || this.typeFilter() !== 'all'
);
readonly loading = signal(false);
```

Avant dans `AccountsComponent`:

```ts
readonly typeFilter = this.accountsFacade.typeFilter;
readonly loading = this.accountsFacade.loading;
```

Apres:

```ts
readonly typeFilter = this.accountsFacade.typeFilter;
readonly hasActiveFilter = this.accountsFacade.hasActiveFilter;
readonly loading = this.accountsFacade.loading;
```

Avant dans `accounts.component.html`:

```html
} @else if (!loading()) {
  <div class="empty">Aucun compte trouve.</div>
}
```

Apres:

```html
} @else if (!loading()) {
  <div class="empty">
    {{ hasActiveFilter() ? 'Aucun compte ne correspond aux filtres.' : 'Aucun compte trouve.' }}
  </div>
}
```

Verification:

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

Point a faire verbaliser:

- le composant ne recalcule pas la regle;
- la regle devient testable;
- la facade expose l'etat utile, pas seulement les donnees brutes.

## 3:50 - 4:00 - Debrief et option Angular recent

Questions de fin:

- quels etats sont de bons `signal()` dans cette app?
- quelles valeurs doivent rester en `computed()`?
- quels effets de bord sont acceptables?
- ou RxJS reste-t-il naturel?
- quelles migrations apportent une vraie valeur dans ce projet?

Option si le groupe avance vite:

| API | Cas metier acceptable dans ce projet | Decision conseillee |
| --- | --- | --- |
| `model()` | Extraire le champ de recherche clients si le meme champ est reutilise dans plusieurs ecrans. | Ne pas l'ajouter tant que le besoin n'existe pas. |
| `linkedSignal()` | Garder une selection de compte coherente quand une liste filtree change. | Pertinent si on ajoute une selection persistante dans la page comptes. |
| `resource()` | Remplacer un chargement read-only par une ressource async. | A presenter comme experimental et non obligatoire. |

Commandes de fin:

```bash
npm test
npm run build
```
