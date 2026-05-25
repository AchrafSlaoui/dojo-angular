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
| 2:15 - 2:45 | Interop Signals / RxJS | `src/app/features/accounts/pages/accounts/accounts.component.ts` |
| 2:45 - 3:20 | `effect()` et limites | `src/app/features/clients/pages/clients/clients.component.ts`, `src/app/features/accounts/pages/accounts/accounts.component.ts` |
| 3:20 - 3:45 | Refactoring guide | `src/app/features/accounts/services/accounts.facade.ts` |
| 3:45 - 4:00 | Debrief et option Angular recent | Toute l'app |

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

Exercice: afficher le nombre de comptes bloques dans l'ecran comptes, d'abord sans `computed()`, puis en transformant ce calcul en signal derive.

### Etape A - Ajouter le compteur sans `computed()`

Avant dans `AccountsComponent`:

```ts
readonly totalBalance = this.accountsFacade.totalBalance;
```

Apres dans `AccountsComponent`, ajouter un getter classique:

```ts
readonly totalBalance = this.accountsFacade.totalBalance;

get blockedAccountsCount(): number {
  return this.accounts().filter((account) => account.status === 'blocked').length;
}
```

Avant dans `accounts.component.html`:

```html
<div class="header-actions">
  <strong>Total affiche: {{ totalBalance() | formatValue:"currency" }}</strong>
</div>
```

Apres:

```html
<div class="header-actions">
  <strong>Total affiche: {{ totalBalance() | formatValue:"currency" }}</strong>
  <strong>Bloques: {{ blockedAccountsCount }}</strong>
</div>
```

Ce que cette version montre:

- le getter fonctionne;
- il depend implicitement de `accounts()`;
- la regle metier reste dans le composant;
- le template ne lit pas une valeur signal avec `()`, mais une propriete TypeScript classique.

### Etape B - Transformer le getter en `computed()`

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

Avant dans `AccountsComponent`, supprimer le getter:

```ts
get blockedAccountsCount(): number {
  return this.accounts().filter((account) => account.status === 'blocked').length;
}
```

Puis exposer le `computed()` de la facade:

```ts
readonly totalBalance = this.accountsFacade.totalBalance;
```

Apres dans `AccountsComponent`:

```ts
readonly totalBalance = this.accountsFacade.totalBalance;
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

Verification possible dans `accounts.component.spec.ts`:

Avant, les donnees de test contiennent deux comptes actifs:

```ts
{ id: 'a1', status: 'active', ... }
{ id: 'a2', status: 'active', ... }
```

Apres, passer un compte en `blocked`:

```ts
{ id: 'a2', clientId: 'c1', label: 'Livret Ada', type: 'saving', status: 'blocked', balance: 250, currency: 'EUR', movements: [] },
```

Puis ajouter dans le test `loads accounts from the current client route`:

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

Preparation deja faite dans le projet: un input classique `showStatus` a ete ajoute a `AccountCardComponent`. Il sert a masquer ou afficher le statut du compte depuis la liste.

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
```

Dans `account-card.component.html`, la lecture est une propriete classique:

```html
@if (showStatus) {
  <div class="meta">
    <span>{{ statusLabel() }}</span>
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
- dans le template du composant enfant, on lit `showStatus` comme une propriete classique;
- ce n'est pas une dependance signal, donc on ne peut pas la composer directement dans un `computed()` sans passer par autre chose.

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
```

Apres:

```ts
showStatus = input(true);
```

Avant dans `account-card.component.html`, version `@Input()`:

```html
@if (showStatus) {
  <div class="meta">
    <span>{{ statusLabel() }}</span>
    <span></span>
  </div>
}
```

Apres, version signal input:

```html
@if (showStatus()) {
  <div class="meta">
    <span>{{ statusLabel() }}</span>
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

- dans le TypeScript et le template, un input signal se lit avec `showStatus()`;
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

Preparation deja faite dans le projet: un output classique `selectedRequested` a ete ajoute a `AccountListComponent`. Il est emis quand l'utilisateur active l'action de modification d'un compte.

### Etat prepare avant le dojo - `selectedRequested` sans signal

Dans `AccountListComponent`, l'import contient encore `EventEmitter` et `Output`:

```ts
import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, output } from '@angular/core';
```

Le composant contient un output classique:

```ts
editRequested = output<Account>();
saveRequested = output<void>();
cancelRequested = output<void>();
deleteRequested = output<Account>();

@Output() selectedRequested = new EventEmitter<Account>();
```

Dans `account-list.component.html`, l'evenement est emis depuis une action existante:

```html
<button
  class="icon-btn lg"
  type="button"
  title="Modifier le compte"
  aria-label="Modifier le compte"
  (click)="selectedRequested.emit(account); editRequested.emit(account)"
  [disabled]="mutating()"
>
  <span class="icon i-edit icon-lg"></span>
</button>
```

Ce que cet etat prepare montre:

- `@Output()` fonctionne toujours;
- `EventEmitter` impose une API differente de `output()`;
- l'evenement est une intention emise par l'enfant, pas une action metier executee dans l'enfant.

### Exercice - Transformer `@Output()` en `output()`

Avant dans `account-list.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, output } from '@angular/core';
```

Apres, retirer `EventEmitter` et `Output`:

```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
```

Avant:

```ts
@Output() selectedRequested = new EventEmitter<Account>();
```

Apres:

```ts
selectedRequested = output<Account>();
```

Dans `account-list.component.html`, l'emission ne change pas:

```html
(click)="selectedRequested.emit(account); editRequested.emit(account)"
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

## 2:15 - 2:45 - Exercice 5: transformer une souscription RxJS en `toSignal()`

Notion: tout ne devient pas signal. Certaines APIs Angular exposent encore des Observables. `toSignal()` sert de pont pour exposer la derniere valeur d'un Observable sous forme de signal.

Preparation deja faite dans le projet: `AccountsComponent` utilise une souscription RxJS explicite a `route.paramMap`, puis copie la valeur dans un signal manuel `clientId`.

### Etat prepare avant le dojo - Observable + souscription manuelle

```ts
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
```

```ts
private readonly route = inject(ActivatedRoute);
private readonly destroyRef = inject(DestroyRef);
private readonly accountsFacade = inject(AccountsFacade);
private readonly clientId$ = this.route.paramMap.pipe(map((params) => params.get('id')));

readonly clientId = signal<string | null>(null);
```

```ts
constructor() {
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
- on copie manuellement la valeur Observable dans un signal local.

### Exercice - Transformer vers `toSignal()`

Avant:

```ts
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
```

Apres:

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

## 2:45 - 3:20 - Exercice 6: transformer une correction imperative en `effect()`

Notion: `effect()` sert a executer un effet de bord quand des signals changent. Il ne doit pas remplacer systematiquement `computed()`, mais il peut synchroniser un etat mutable avec une contrainte derivee.

Preparation deja faite dans le projet: `ClientsComponent` corrige la pagination de maniere imperative apres suppression d'un client.

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

## 3:20 - 3:45 - Exercice 7: refactoring guide dans une facade

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

## 3:45 - 4:00 - Debrief et option Angular recent

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
