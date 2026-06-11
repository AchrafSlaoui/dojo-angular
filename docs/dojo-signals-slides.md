# Angular 21 Signals — Support de présentation dojo

---

## Zone.js

Ce dojo se déroule en **Angular 21**. Le projet garde volontairement `zone.js` pour montrer une migration progressive vers Signals.

**Zone.js** aide Angular à savoir qu'un événement asynchrone a eu lieu. Il patche les APIs du navigateur (`setTimeout`, `Promise`, `addEventListener`, `XMLHttpRequest`, etc.) puis prévient Angular qu'un cycle de détection doit être lancé.

Zone.js ne modélise pas l'état de l'application : il sert surtout à **déclencher** la détection de changement après un événement.

- Définition : librairie qui intercepte les APIs async du navigateur.
- Rôle : prévenir Angular qu'un cycle de détection doit être lancé.
- Limite : il déclenche une vérification, mais ne dit pas quel état a changé.

---

## Signal

Un **signal** est une valeur réactive observable par Angular. Il contient une valeur, se lit avec `()`, et Angular mémorise automatiquement les templates, `computed()` et `effect()` qui l'ont lu.

Le problème résolu par Signals : rendre l'état local explicite et permettre à Angular de savoir précisément quelles vues ou valeurs dérivées dépendent de cet état.

- Définition : valeur réactive lue avec `()`.
- Rôle : mémoriser les lecteurs dépendants.
- Problème résolu : état explicite et mises à jour plus ciblées.

```
Zone.js : un événement async se produit → Angular lance la détection
Signals : une valeur change             → Angular connaît les lecteurs dépendants
```

---

## OnPush

`OnPush` est une stratégie de détection de changement qui limite les vérifications inutiles d'un composant.

Avec `OnPush`, Angular vérifie surtout un composant quand :

- un `input` change ;
- un événement du template se produit ;
- un signal lu dans le template change ;
- une vérification est demandée explicitement.

Dans ce dojo, `OnPush` permet de montrer que Signals rend les dépendances plus précises sans imposer une migration immédiate en zoneless.

| Déclencheur | Zone.js (défaut) | Zone.js + OnPush | Zoneless |
|---|---|---|---|
| Événement async (`setTimeout`, `Promise`, XHR…) | Tout l'arbre | Sous-arbre marqué dirty | Aucun déclencheur automatique |
| `@Input()` dont la référence change | ✓ | ✓ | Aucun effet — utiliser `input()` |
| `input()` / signal lu dans le template | ✓ | ✓ | ✓ |
| `async` pipe reçoit une valeur | ✓ | ✓ | Composant + parents vérifiés (`markForCheck`) |
| Événement template sans signal modifié | ✓ | ✓ | Aucun effet |

---

## Zoneless

Une application **zoneless** fonctionne sans `zone.js`. Angular ne s'appuie plus sur le patch automatique des APIs async pour lancer la détection de changement.

En zoneless, les mises à jour doivent venir de mécanismes explicites :

- signals lus par les templates ;
- `input()` / `output()` ;
- `async` pipe ;
- appels explicites de détection si nécessaire.

En zoneless, signal et `async` pipe ne se comportent pas de la même façon : un signal met à jour uniquement ses lecteurs directs. `async` pipe appelle `markForCheck()` — le composant et ses parents sont vérifiés, le DOM est mis à jour seulement si quelque chose a effectivement changé.

Ce dojo garde `zone.js` au départ. La migration zoneless est la suite naturelle une fois l'état principal piloté par Signals.

```
Signals résout : l'état réactif local synchrone
Zone.js résout : le déclenchement automatique de la détection après async
```

```
Zone.js (défaut)
  → ajouter OnPush sur chaque composant
    → migrer les états vers signal() / input() / output()
      → provideZonelessChangeDetection() + supprimer zone.js
```

```ts
// app.config.ts — activer zoneless (Angular 21, stable)
provideZonelessChangeDetection()

// angular.json — retirer zone.js des polyfills
"polyfills": []
```

---

## Intention d'architecture du dojo

Les décisions d'architecture pédagogique sont détaillées dans `docs/adr/0001-architecture-pedagogique-dojo-signals.md`.

Le projet montre volontairement deux patterns : des Signals directement dans les composants pour apprendre les bases, puis des Signals dans des façades pour l'état partagé et les règles métier. L'asymétrie est intentionnelle : on commence simple, puis on extrait quand l'état devient plus riche ou partagé.

Le détail du code mixte pendant la migration est documenté dans l'ADR 0001.

Le support présente un panorama ciblé des APIs Signals et APIs Angular associées utilisées dans cette application. Il ne cherche pas à couvrir toute la surface d'API Angular.

---

## Mapping exercices / branches / fichiers

| Exercice | Branche | Concept | Fichiers principaux |
|---|---|---|---|
| 1 | `exercice-1` | `signal()` | `clients.component.ts`, `clients.component.html`, `clients.component.spec.ts` |
| 2 | `exercice-2` | `computed()` en façade | `accounts.facade.ts`, `accounts.component.ts`, `accounts.component.html`, `accounts.component.spec.ts` |
| 3 | `exercice-3` | `effect()` pour cohérence d'état | `clients.component.ts` |
| 4 | `exercice-4` | `viewChild()` + `effect()` DOM | `clients.component.ts` |
| 5 | `exercice-5` | `input()` | `account-card.component.ts` |
| 6A | `exercice-6` | `output()` | `account-list.component.ts` |
| 6B | `exercice-6-model` | `model()` | `account-list.component.ts`, `accounts.component.ts` |
| 7 | `exercice-7` | `linkedSignal()` | `accounts.component.ts` |
| 8 | `exercice-8` | `toSignal()` / `toObservable()` | `accounts.component.ts`, `dashboard.component.ts`, `dashboard.component.spec.ts`, `clients.component.ts` |
| 9 | `exercice-9` | `afterNextRender()` / `afterEveryRender()` | `clients.component.ts` |
| 10 | `exercice-10` | `computed()` en façade | `accounts.facade.ts`, `accounts.component.ts`, `accounts.component.html` |

Les branches sont cumulatives jusqu'à `exercice-5`.

`exercice-6` et `exercice-6-model` sont deux variantes parallèles du même exercice :

- `exercice-6` traite la version `output()` ;
- `exercice-6-model` traite la version `model()`.

`exercice-6-model` n'est pas une étape après `exercice-6`. Après la restitution, le parcours commun reprend sur `exercice-7`.

---

## Exercice 1 — `signal()`

### Définition

> `signal()` est une **primitive Signal** : une valeur réactive observable par Angular. Elle contient une valeur, se lit avec `()`, et Angular mémorise automatiquement les templates, `computed()` et `effect()` qui l'ont lue.

Quand la valeur change, Angular sait précisément quelles dépendances invalider : les valeurs dérivées sont recalculées si nécessaire et les vues concernées sont mises à jour.

`signal()` crée un signal mutable. `computed()` crée un signal dérivé en lecture seule. `effect()` observe des signals, mais n'est pas un signal.

```ts
readonly adding = signal(false);  // déclarer
this.adding.set(true);            // écrire
this.adding.update(v => !v);      // mettre à jour depuis la valeur courante
adding()                          // lire (template ou TS)
```

Dans cet exercice, `.set(true)` et `.set(false)` sont préférables à `.update()` : la nouvelle valeur ne dépend pas de l'ancienne. `.update()` devient utile quand on calcule la nouvelle valeur à partir de la valeur courante, par exemple `this.adding.update(value => !value)`.

Sur la branche `init`, `adding` est encore un booléen classique. Tant qu'il n'a pas été converti en `signal(false)`, il n'a donc pas de méthode `.set()` ou `.update()`.

### Problématique corrigée

Le composant manipule un état UI local avec une propriété classique (`adding`). Cette valeur pilote le template, mais elle n'exprime pas explicitement ses dépendances réactives : Angular ne voit qu'une propriété mutable ordinaire.

`signal()` corrige ce point en transformant l'état local en source réactive explicite. Le template lit `adding()`, les changements passent par `.set()` ou `.update()`, et Angular sait précisément quelles vues invalider.

### Fichier à modifier

`src/app/features/clients/pages/clients/clients.component.ts`

### Consigne

Convertir la propriété `adding = false` en signal.

```ts
// Avant
adding = false;
startAdd(): void { this.adding = true; }
cancelAdd(): void { this.adding = false; }

// Après
readonly adding = signal(false);
startAdd(): void { this.adding.set(true); }
cancelAdd(): void { this.adding.set(false); }
```

Dans le template : remplacer `adding` par `adding()`.

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts
```

### Quand utiliser `signal()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| État UI local : booléen, texte, page courante | `signal()` |
| État local transitoire manipulé seulement par des handlers template | Propriété classique acceptable pendant la migration |
| Valeur calculée à partir d'autres signals | `computed()` — pas `signal()` |
| Valeur issue d'une route ou d'un appel HTTP | `toSignal()` |
| État partagé entre composants via service | façade Signals ou store dédié |

---

## Exercice 2 — `computed()`

### Définition

> `computed()` est une **primitive Signal** : une valeur dérivée mémorisée. Le calcul ne se relance que si une dépendance lue a changé depuis la dernière lecture.

```ts
readonly blockedAccountsCount = computed(() =>
  this.filteredAccounts().filter(a => a.status === 'blocked').length
);

blockedAccountsCount()  // lecture
```

### Problématique corrigée

Le compteur de comptes bloqués est une règle dérivée de `filteredAccounts()`. Sous forme de getter, il est recalculé à chaque lecture et reste exposé comme une simple valeur, sans contrat réactif clair.

`computed()` corrige ce problème en nommant la règle métier et en la mettant en cache. Le compteur devient un signal en lecture seule, recalculé uniquement quand les comptes filtrés changent.

### Fichiers à modifier

- `src/app/features/accounts/services/accounts.facade.ts`
- `src/app/features/accounts/pages/accounts/accounts.component.ts`
- `src/app/features/accounts/pages/accounts/accounts.component.html`

### Consigne

Transformer le getter `blockedAccountsCount` en `computed()` dans la façade, puis exposer le signal dans le composant.

```ts
// Avant — AccountsFacade
get blockedAccountsCount(): number {
  return this.filteredAccounts().filter(a => a.status === 'blocked').length;
}

// Après — AccountsFacade
readonly blockedAccountsCount = computed(() =>
  this.filteredAccounts().filter(a => a.status === 'blocked').length
);
```

```ts
// Avant — AccountsComponent
get blockedAccountsCount(): number { return this.accountsFacade.blockedAccountsCount; }

// Après — AccountsComponent
readonly blockedAccountsCount = this.accountsFacade.blockedAccountsCount;
```

Dans le template : `{{ blockedAccountsCount }}` → `{{ blockedAccountsCount() }}`

La façade protège ses états internes avec `.asReadonly()` : les composants peuvent lire la valeur mais ne peuvent pas appeler `.set()` dessus.

```ts
// AccountsFacade — état interne protégé
private readonly accountsState = signal<Account[]>([]);
readonly accounts = this.accountsState.asReadonly(); // Signal<Account[]> en lecture seule
```

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

### Quand utiliser `computed()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Total, compteur, libellé dérivé d'autres signals | `computed()` |
| Règle qui dépend du temps (debounce, delay) | Flux asynchrone — `computed()` est synchrone |
| Calcul déclenché par une source asynchrone | Source asynchrone puis `toSignal()` |
| Effet de bord (appel HTTP, log, focus) | `effect()` — pas `computed()` |

---

## Exercice 3 — `effect()` pour synchroniser un état

### Définition `effect()`

> `effect()` est une **primitive Signal** : elle exécute un effet de bord quand les signals lus dans son corps changent. Elle s'exécute automatiquement, sans appel explicite.

### Problématique corrigée

La page courante doit rester cohérente avec le nombre de résultats. Sans réaction centralisée, chaque mutation de liste doit penser à appeler une méthode impérative de recalage, ce qui disperse la règle et crée un risque d'oubli.

`effect()` corrige ce point en rendant la cohérence automatique : dès que la tranche paginée change, la page est recalée. `untracked()` évite que la lecture de comparaison de `page()` devienne une dépendance inutile de l'effet.

### Fichier à modifier

`src/app/features/clients/pages/clients/clients.component.ts`

### Consigne

Remplacer l'appel impératif `this.clampCurrentPage()` par un `effect()` dans le constructeur, en utilisant `untracked()` pour lire la page courante sans en faire une dépendance de l'effet.

```ts
// Ajouter untracked aux imports
import { effect, untracked } from '@angular/core';

// Ajouter dans le constructeur
effect(() => {
  const clamped = this.pageSlice().page;
  if (clamped !== untracked(this.page)) this.page.set(clamped);
});

// Supprimer dans deleteClient()
this.clampCurrentPage(); // ← retirer cette ligne

// Supprimer la méthode
private clampCurrentPage(): void { ... }
```

Point d'attention : `this.page()` est lu uniquement pour comparer avant d'écrire. `untracked()` évite d'ajouter cette lecture directe aux dépendances de l'effet. La dépendance utile reste `pageSlice()`, qui porte la page recalculée.

```ts
// Sans untracked() : page() est suivi directement en plus de pageSlice()
effect(() => {
  const clamped = this.pageSlice().page;
  if (clamped !== this.page()) this.page.set(clamped);
});

// Avec untracked() : page() sert seulement à éviter une écriture inutile
effect(() => {
  const clamped = this.pageSlice().page;
  if (clamped !== untracked(this.page)) this.page.set(clamped);
});
```

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts
```

### Nettoyage de l'effet — `onCleanup`

Quand un effet crée une ressource (timer, abonnement, listener), `onCleanup` permet de la libérer avant que l'effet se ré-exécute ou que le composant soit détruit.

```ts
effect((onCleanup) => {
  const id = setInterval(() => console.log(this.search()), 1000);
  onCleanup(() => clearInterval(id));
});
```

Sans `onCleanup`, chaque ré-exécution de l'effet crée un nouveau timer sans supprimer le précédent.

### Quand utiliser `effect()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Titre du document, focus, scroll après changement d'état | `effect()` |
| Correction d'un état cohérent (clamping, reset) | `effect()` |
| Chargement HTTP déclenché par un signal | Possible avec `effect()`, mais à encadrer |
| Valeur calculée à partir d'autres signals | `computed()` — pas `effect()` |
| Effet déclenché par une source asynchrone | Source asynchrone ou `toSignal()` selon le cas |

---

## Exercice 4 — `viewChild()` + `effect()` pour le DOM

### Définition `viewChild()`

> `viewChild()` est une **API Angular de requête de vue** : elle expose une référence DOM ou composant enfant comme un signal. Elle retourne `undefined` quand l'élément est absent du DOM, `ElementRef` quand il est présent.

```ts
// Avant : ViewChild classique
@ViewChild('firstNameRef') private firstNameInput?: ElementRef;

// Après : ViewChild signal
private readonly firstNameInput = viewChild<ElementRef>('firstNameRef');
```

### Problématique corrigée

Le champ prénom n'existe dans le DOM que lorsque le formulaire d'ajout est affiché. Avec `@ViewChild`, il faut raisonner avec le cycle de vie Angular et vérifier manuellement si la référence est déjà disponible.

`viewChild()` corrige ce problème en exposant la référence comme un signal : `undefined` quand l'élément est absent, `ElementRef` quand il apparaît. Couplé à `effect()`, le focus devient une réaction au DOM réellement rendu.

### Fichier à modifier

`src/app/features/clients/pages/clients/clients.component.ts`

Cet exercice montre un deuxième usage de `effect()` : déclencher un effet DOM quand un élément référencé par `viewChild()` apparaît. Ici, on veut placer le focus sur le champ prénom dès qu'il est présent dans le DOM.

### Consigne

Transformer le `@ViewChild` classique en `viewChild()` signal, puis créer un `effect()` dans le constructeur pour déclencher le focus quand le formulaire d'ajout est ouvert.

```ts
// Avant
@ViewChild('firstNameRef') private firstNameInput?: ElementRef;

// Après
private readonly firstNameInput = viewChild<ElementRef>('firstNameRef');

// À créer dans le constructeur
effect(() => {
  this.firstNameInput()?.nativeElement.focus();
});
```

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts
```

### Pourquoi `effect()` ici

Le focus n'est pas une valeur calculée : c'est une interaction avec le DOM. `effect()` est adapté parce qu'il réagit à la présence réelle de l'élément exposé par `viewChild()`.

### Extension — `viewChildren()`

`viewChildren()` retourne toutes les occurrences correspondant au sélecteur sous forme de `Signal<readonly T[]>`. Là où `viewChild()` cible un seul élément, `viewChildren()` observe la liste entière et se met à jour à chaque rendu.

```ts
// viewChild() — un seul élément
private readonly firstNameInput = viewChild<ElementRef>('firstNameRef');

// viewChildren() — toutes les cartes rendues dans le @for
private readonly cards = viewChildren(ClientCardComponent);
// Signal<readonly ClientCardComponent[]>
```

---

## Exercice 5 — `input()`

### Définition

> `input()` est une **API composant Angular** : elle déclare une entrée de composant sous forme de signal. La valeur passée par le parent devient une dépendance réelle dans les `computed()` et `effect()`.

```ts
showStatus = input(true);              // avec valeur par défaut
account = input.required<Account>();   // requis
showStatus()                           // lecture
```

### Problématique corrigée

Le composant calcule `visibleStatusLabel` à partir de `showStatus`. Avec un `@Input()` classique lu dans un `computed()`, Angular ne crée pas de dépendance réactive : si le parent change l'entrée, le calcul peut rester basé sur une ancienne valeur.

`input()` corrige ce problème en exposant l'entrée comme un signal. Le `computed()` lit `showStatus()`, donc il est automatiquement invalidé quand le parent modifie l'entrée.

### Fichier à modifier

`src/app/features/accounts/components/account-card/account-card.component.ts`

### Consigne

Transformer `@Input() showStatus = true` en `showStatus = input(true)` et retirer `Input` des imports.

```ts
// Avant
@Input() showStatus = true;
readonly visibleStatusLabel = computed(() => this.showStatus ? this.statusLabel() : null);

// Après
showStatus = input(true);
readonly visibleStatusLabel = computed(() => this.showStatus() ? this.statusLabel() : null);
```

> Point clé : `@Input()` dans un `computed()` ne crée **pas** de dépendance réelle. `input()` dans un `computed()` **est** une dépendance réelle.

```bash
npm test -- --runTestsByPath src/app/features/accounts/components/account-card/account-card.component.spec.ts
```

### Quand utiliser `input()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Entrée lue dans un `computed()` ou `effect()` | `input()` |
| Entrée requise sans valeur par défaut | `input.required<T>()` |
| Entrée legacy dans un composant non migré | `@Input()` acceptable |
| Valeur bidirectionnelle parent ↔ enfant | `model()` (voir parenthèse après `output()`) |

---

## Exercice 6A — `output()`

### Définition

> `output()` est une **API composant Angular** : elle déclare un événement sortant du composant. L'enfant émet une intention, le parent décide quoi faire. Ce n'est pas un Observable.

```ts
selectedRequested = output<Account>();       // déclarer
this.selectedRequested.emit(account);        // émettre
(selectedRequested)="startEdit($event)"      // écouter dans le parent
```

### Problématique corrigée

`selectedRequested` est encore déclaré avec `@Output()` et `EventEmitter`, alors que le reste du composant utilise déjà les nouvelles sorties Angular. Le composant mélange donc deux styles pour exprimer le même contrat.

`output()` corrige ce problème en déclarant clairement un événement sortant sans l'habiller comme un Observable RxJS. L'enfant émet une intention, le parent garde la décision métier.

### Fichier à modifier

`src/app/features/accounts/components/account-list/account-list.component.ts`

### Lecture guidée

Le fichier contient déjà plusieurs sorties écrites avec `output()` :

```ts
editRequested = output<Account>();
saveRequested = output<void>();
cancelRequested = output<void>();
deleteRequested = output<Account>();
```

Elles servent de modèle local. L'exercice consiste à aligner la dernière sortie legacy, `selectedRequested`, sur le même style.

### Consigne

Transformer `@Output() selectedRequested = new EventEmitter<Account>()` en `output()`. Retirer `EventEmitter` et `Output` des imports.

```ts
// Avant
@Output() selectedRequested = new EventEmitter<Account>();

// Après
selectedRequested = output<Account>();
```

L'émission dans l'`effect()` reste identique : `this.selectedRequested.emit(account)`.

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

### Quand utiliser `output()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Événement vers le parent direct | `output()` |
| Événement global ou cross-composant | Service dédié |
| Valeur bidirectionnelle entrée + sortie | `model()` (voir exercice 6B) |

---

## Exercice 6B — `model()`

### Définition

> `model()` est une **API composant Angular** : elle déclare une valeur bidirectionnelle entre parent et enfant. L'enfant peut lire et modifier la valeur directement, sans émettre d'événements. Elle combine `input()` et `output()` en une seule déclaration.

```ts
editingAccountId = model<string | null>(null);

// Enfant : contrôle direct
this.editingAccountId.set(account.id);  // ouvrir
this.editingAccountId.set(null);         // fermer

// Parent : liaison bidirectionnelle
[(editingAccountId)]="editingAccountId"
```

### Problématique corrigée

L'état d'édition est une valeur partagée entre parent et enfant. Avec `input()` + `editRequested` + `cancelRequested`, une seule valeur logique est éclatée entre une entrée et plusieurs événements de synchronisation.

`model()` corrige ce problème en déclarant explicitement une valeur bidirectionnelle. L'enfant peut ouvrir ou fermer l'édition avec `.set()`, tandis que le parent garde une liaison unique `[(editingAccountId)]`.

### Fichiers à modifier

- `src/app/features/accounts/components/account-list/account-list.component.ts`
- `src/app/features/accounts/pages/accounts/accounts.component.ts`

### Consigne

Dans `account-list.component.ts`, remplacer les trois déclarations par un seul `model()` :

```ts
// Avant
editingAccountId = input<string | null>(null);
editRequested    = output<Account>();
cancelRequested  = output<void>();

// Après
editingAccountId = model<string | null>(null);
```

Modifier `requestEdit()` pour appeler `.set()` directement, et ajouter `cancelEdit()` :

```ts
requestEdit(account: Account): void {
  this.selectedAccount.set(account);
  this.editingAccountId.set(account.id);  // remplace editRequested.emit(account)
}

cancelEdit(): void {
  this.editingAccountId.set(null);
}
```

Dans `accounts.component.ts`, convertir `editingAccountId` en signal et simplifier `startEdit()` :

```ts
// Avant
editingAccountId: string | null = null;
startEdit(account: Account): void {
  this.editingAccountId = account.id;
  this.editAccount = { id: account.id, label: account.label, type: account.type, status: account.status };
}
cancelEdit(): void { this.editingAccountId = null; }

// Après
readonly editingAccountId = signal<string | null>(null);
startEdit(account: Account): void {
  // editingAccountId est désormais géré par l'enfant via model()
  this.editAccount = { id: account.id, label: account.label, type: account.type, status: account.status };
}
// cancelEdit() supprimée : l'enfant appelle .set(null) directement
```

Dans le template `accounts.component.html`, remplacer les trois liaisons par une seule :

```html
<!-- Avant -->
[editingAccountId]="editingAccountId"
(editRequested)="startEdit($event)"
(cancelRequested)="cancelEdit()"

<!-- Après -->
[(editingAccountId)]="editingAccountId"
(editRequested)="startEdit($event)"
```

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

### `output()` vs `model()` — récapitulatif

| | `output()` — exercice 6A | `model()` — exercice 6B |
|---|---|---|
| Propriétaire de l'état | Parent | Partagé (enfant peut modifier) |
| Contrat | Événement → action dans le parent | Valeur bidirectionnelle |
| Usage typique | Intentions (clic, soumission) | Sélections, filtres, toggles |
| Binding parent | `(editRequested)="startEdit($event)"` | `[(editingAccountId)]="editingAccountId"` |

## Exercice 7 — `linkedSignal()`

### Définition

> `linkedSignal()` est une **primitive Signal** : elle crée un signal writable dérivé d'un autre signal. Contrairement à `computed()` qui est en lecture seule, sa valeur peut être modifiée par `.set()` ou `.update()`. Elle est automatiquement recalculée quand la source change.

```ts
readonly value = linkedSignal(() => this.source());
value()        // lecture
value.set(x)   // écriture possible — contrairement à computed()
// Quand source() change → value() est recalculée depuis la source
```

### Problématique corrigée

Le formulaire d'édition doit être initialisé depuis le compte sélectionné, puis rester modifiable localement. Un `computed()` serait recalculé mais non modifiable ; un `signal()` simple serait modifiable mais ne se réinitialiserait pas automatiquement quand la sélection change.

`linkedSignal()` corrige cette tension : la valeur repart de la source quand le compte sélectionné change, mais elle reste writable entre deux changements pour porter les modifications du formulaire.

### Fichier à modifier

`src/app/features/accounts/pages/accounts/accounts.component.ts`

### Consigne

Convertir `editAccount` en `linkedSignal()` dérivé du compte sélectionné. Ajouter un signal `accountForEdit` pour porter la sélection courante.

```ts
// Avant
editAccount: AccountUpdate = { id: '', label: '', type: 'checking', status: 'active' };

startEdit(account: Account): void {
  this.editingAccountId = account.id;
  this.editAccount = { id: account.id, label: account.label, type: account.type, status: account.status };
}

// Après
private readonly accountForEdit = signal<Account | null>(null);
readonly editAccount = linkedSignal<AccountUpdate>(() => {
  const a = this.accountForEdit();
  return a
    ? { id: a.id, label: a.label, type: a.type, status: a.status }
    : { id: '', label: '', type: 'checking', status: 'active' };
});

startEdit(account: Account): void {
  this.editingAccountId = account.id;
  this.accountForEdit.set(account);
}
```

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

### `linkedSignal()` vs `computed()`

| `computed()` | `linkedSignal()` |
|---|---|
| Lecture seule | Writable — `.set()` et `.update()` disponibles |
| Recalculé quand les dépendances changent | Recalculé quand la source change, modifiable entre deux |
| Adapté aux valeurs dérivées stables | Adapté aux formulaires pré-remplis depuis une sélection |

### Quand utiliser `linkedSignal()`

| Situation | Outil |
|---|---|
| Valeur dérivée en lecture seule | `computed()` |
| Formulaire pré-rempli depuis une sélection, modifiable par l'utilisateur | `linkedSignal()` |
| État local sans dérivation | `signal()` |

---

## Exercice 8 — Interop RxJS progressive

### Définition

> `toSignal()` et `toObservable()` sont des **APIs d'interop RxJS** : `toSignal()` convertit un Observable en signal (dernière valeur émise, abonnement géré automatiquement), `toObservable()` expose un signal comme Observable pour brancher des opérateurs RxJS.

```ts
// Signal → Observable pour opérateurs RxJS
readonly debouncedSearch$ = toObservable(this.search).pipe(debounceTime(300));
```

### Problématique corrigée

Le code initial mélange des souscriptions manuelles, du `takeUntilDestroyed`, des états `loading/error` gérés à la main et des conversions ponctuelles avec `firstValueFrom()`. Le composant porte trop de plomberie RxJS alors que le template a surtout besoin de lire des valeurs.

`toSignal()` corrige ce problème en exposant la dernière valeur d'un Observable comme signal, avec abonnement géré par Angular. `toObservable()` couvre le besoin inverse : repasser temporairement par RxJS quand une temporalité comme `debounceTime()` est nécessaire.

### Fichiers à modifier

**8a — `toSignal()` simple** — `src/app/features/accounts/pages/accounts/accounts.component.ts`

**8b — `toSignal()` avec état de chargement** — `src/app/features/clients/pages/dashboard/dashboard.component.ts`

**8c — `toObservable()`** — `src/app/features/clients/pages/clients/clients.component.ts` *(lecture seule / bonus)*

### Progression

Cet exercice est le plus dense du dojo. Il se découpe en trois marches :

1. Convertir un Observable simple en signal.
2. Ajouter l'état `loading/error` autour d'un flux HTTP.
3. Lire `toObservable()` comme pont inverse, sans demander de modification.

Le but n'est pas de remplacer RxJS. Le but est de savoir où placer la frontière : RxJS compose le flux, `toSignal()` expose sa dernière valeur au template signal.

### Consigne

**8a** : remplacer la souscription manuelle à `paramMap` par `toSignal()`.

```ts
// Avant — souscription manuelle
readonly clientId = signal<string | null>(null);
constructor() {
  this.clientId$.pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(id => { this.clientId.set(id); this.accountsFacade.load(id); });
}

// Après
readonly clientId = toSignal(
  this.route.paramMap.pipe(map(p => p.get('id'))),
  { initialValue: null }
);
constructor() {
  effect(() => { this.accountsFacade.load(this.clientId()); });
}
```

Nettoyer aussi les imports devenus inutiles :

```ts
// À retirer après conversion
DestroyRef
takeUntilDestroyed
```

**8b** : remplacer `firstValueFrom()` + états manuels par `toSignal()` + pipe RxJS.

Point d'attention : ici RxJS reste utile. Le `pipe()` construit un petit état de vue unique : données, chargement et erreur.

### Lecture de la pipeline 8b

Dans cette pipeline :

- `startWith(...)` donne l'état initial avant la réponse HTTP ;
- `map(...)` transforme la réponse HTTP en état de vue réussi ;
- `catchError(...)` transforme l'erreur HTTP en état de vue en erreur ;
- `toSignal(...)` expose la dernière version de cet état au template.

```ts
private readonly clientsQuery = toSignal(
  this.clientsApi.getAll().pipe(
    map(clients => ({ clients, loading: false, error: null })),
    catchError(err => of({ clients: [], loading: false, error: err.message })),
    startWith({ clients: [], loading: true, error: null })
  ),
  { initialValue: { clients: [], loading: true, error: null } }
);
readonly loading = computed(() => this.clientsQuery().loading);
readonly error   = computed(() => this.clientsQuery().error);
```

La méthode `reload()` disparaît : le chargement initial est porté par le signal créé avec `toSignal()`.

**8c** : lire et expliquer `debouncedSearch$` dans `ClientsComponent` (pas de modification).

Cette partie sert de consolidation. Elle montre le pont inverse : on part d'un signal local, puis on repasse en Observable uniquement parce qu'un opérateur temporel (`debounceTime`) est nécessaire.

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
npm test -- --runTestsByPath src/app/features/clients/pages/dashboard/dashboard.component.spec.ts
```

### Quand utiliser `toSignal()` / `toObservable()` — et quand rester en RxJS pur

| Situation | Outil |
|---|---|
| Lire `paramMap` ou `queryParamMap` dans un composant signal | `toSignal()` |
| Observable HTTP one-shot dans un composant signal | `toSignal()` + `pipe(map, catchError, startWith)` |
| Debounce, `distinctUntilChanged` sur un signal | `toObservable()` + `pipe()` |
| Flux continu (WebSocket, polling) | RxJS pur |
| Combiner deux flux avec temporalité | `combineLatest` RxJS |
| Requête POST / PUT / DELETE | `firstValueFrom()` dans une méthode async |

---

## Exercice 9 — `afterNextRender()` / `afterEveryRender()`

### Définition

> `afterNextRender()` et `afterEveryRender()` sont des **hooks de rendu Angular** : ils permettent d'exécuter du code après qu'Angular a écrit dans le DOM, quand les mesures et manipulations DOM sont sûres.

| | `afterNextRender()` | `afterEveryRender()` |
|---|---|---|
| Fréquence | **Une seule fois** après le prochain rendu | **Après chaque** cycle de rendu |
| Usage typique | Scroll one-shot, init librairie tierce | Mesures DOM continues |
| Risque | Aucun surcoût après l'exécution | Coûteux si le rendu est fréquent |

```ts
// one-shot : scroll après une action
afterNextRender(
  () => { /* DOM garanti stable ici */ },
  { injector: this.injector }  // nécessaire hors du constructeur
);

// récurrent : mesure à chaque rendu
afterEveryRender(() => {
  this.height.set(this.el.nativeElement.offsetHeight);
});
```

### Différence clé avec `effect()`

```
effect()          → réactif : se relance à chaque changement de dépendance
afterNextRender() → one-shot : s'exécute une fois après le prochain rendu
afterEveryRender() → récurrent : s'exécute après chaque cycle de rendu
```

### Problématique corrigée

Le scroll en haut de liste doit se produire après l'ajout d'un client, mais seulement quand le rendu suivant a réellement créé ou réorganisé le DOM. Un `effect()` serait trop large : il observerait un état et pourrait se relancer au-delà de l'action concernée.

`afterNextRender()` corrige ce problème en planifiant une action DOM one-shot après le prochain rendu Angular. `afterEveryRender()` couvre le cas différent des mesures récurrentes, mais il n'est pas nécessaire pour le scroll de cet exercice.

### Fichier à modifier

`src/app/features/clients/pages/clients/clients.component.ts`

### Consigne

Après l'ajout d'un client, scroller le viewport virtuel en haut de liste avec `afterNextRender()`.

Ajouter d'abord les imports nécessaires :

```ts
import { afterNextRender, Injector, viewChild } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
```

Puis ajouter les références DOM dans le composant :

```ts
private readonly viewport = viewChild(CdkVirtualScrollViewport);
private readonly injector = inject(Injector);
```

```ts
// Dans saveAdd(), à la place du commentaire EXERCICE 9
afterNextRender(
  () => { this.viewport()?.scrollToIndex(0); },
  { injector: this.injector }
);
```

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts
```

### Pourquoi pas `effect()` ici

`effect()` se déclencherait à chaque changement de signal observé, pas uniquement après un ajout. `afterNextRender()` est plus précis : il garantit un seul scroll après le rendu qui suit l'action, sans observer continuellement l'état.

### Quand utiliser `afterNextRender()`

| Situation | Outil |
|---|---|
| Scroll, mesure DOM après une action utilisateur | `afterNextRender()` avec `injector` |
| Initialisation one-shot d'une librairie tierce | `afterNextRender()` dans le constructeur |
| Réaction continue à un changement d'état | `effect()` |
| Opération DOM déclenchée par l'apparition d'un élément | `effect()` + `viewChild()` |

## Exercice 10 — Consolidation façade avec `computed()`

Cet exercice ne présente pas une nouvelle API. Il sert à consolider l'architecture : une règle métier dérivée doit vivre au bon endroit, avec un nom explicite et une surface testable.

### Définition

> Cet exercice est une **consolidation d'architecture** : l'API utilisée est `computed()`, mais l'objectif principal est d'exposer une règle métier dérivée dans la façade plutôt que de la calculer en ligne dans le template ou le composant.

### Problématique corrigée

Le message vide dépend d'une règle métier : savoir si l'utilisateur a activé un filtre. Si cette règle reste calculée dans le template ou dans la page, elle est difficile à nommer, à tester et à réutiliser.

La consolidation corrige ce problème en déplaçant la règle dans la façade sous forme de `computed()`. La page consomme un signal nommé `hasActiveFilter`, et le template ne porte plus la logique métier.

### Fichiers à modifier

- `src/app/features/accounts/services/accounts.facade.ts`
- `src/app/features/accounts/pages/accounts/accounts.component.ts`
- `src/app/features/accounts/pages/accounts/accounts.component.html`

### Consigne

Ajouter `hasActiveFilter` comme `computed()` dans la façade, l'exposer dans le composant, l'utiliser dans le template.

```ts
// accounts.facade.ts — ajouter après typeFilter
readonly hasActiveFilter = computed(() =>
  this.search().trim().length > 0 || this.typeFilter() !== 'all'
);
```

```ts
// AccountsComponent — exposer le signal de la façade
readonly hasActiveFilter = this.accountsFacade.hasActiveFilter;
```

```html
<!-- accounts.component.html — remplacer le message vide -->
{{ hasActiveFilter() ? 'Aucun compte ne correspond aux filtres.' : 'Aucun compte trouvé.' }}
```

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

### Pourquoi terminer par cet exercice

Après les APIs avancées, on revient à une règle simple : une règle métier dérivée doit être nommée au bon endroit. Ici, `hasActiveFilter` appartient à la façade parce qu'il dépend de l'état de filtre partagé par la page.

---

## Récapitulatif — Signal ou RxJS ?

| Utiliser Signals | Utiliser RxJS |
|---|---|
| État UI local synchrone | Flux impliquant le **temps** (`debounceTime`, `delay`…) |
| Valeur dérivée d'autres états locaux | Combinaison de plusieurs sources (`combineLatest`, `merge`) |
| Entrée / sortie de composant réactive | Source continue (WebSocket, polling) |
| Effet de bord déclenché par un état | Commande async (POST, PUT, DELETE) |
| Consommer un Observable dans un composant | Multicasting (`shareReplay`, `share`) |

### Zone d'intersection — utiliser les deux

```
Signal → toObservable() → pipe(debounceTime) → toSignal()
Observable HTTP         → pipe(map, catchError, startWith) → toSignal()
```

---

## API à connaître — `rxResource()`

`rxResource()` applique le modèle `resource` à une source RxJS : la ressource expose `value()`, `isLoading()` et `error()` à partir d'un Observable.

Dans Angular 21.2, cette API est encore marquée `experimental`. Elle est donc utile à connaître, mais elle reste hors exercices et hors convention de production pour ce dojo.

```ts
private readonly clientsResource = rxResource({
  stream: () => this.clientsApi.getAll(),
  defaultValue: []
});
```

À retenir : `rxResource()` vise les lectures async avec état de chargement. Pour ce support, on garde `toSignal()` + RxJS afin de rester sur des APIs stables.

---

## Clôture du dojo — Règles à retenir

Les conventions d'usage des APIs Signals utilisées ici et la décision de ne pas migrer vers
le mode zoneless sont détaillées dans `docs/adr/0002-conventions-usage-signals-et-detection-changement.md`.

```
1. computed()         ne fait jamais d'appel HTTP — calcul pur uniquement
2. effect()           n'expose jamais de valeur    — effets de bord uniquement
3. L'enfant émet une INTENTION, le parent exécute l'ACTION
4. Ne pas bridger signal ↔ RxJS systématiquement — rester dans un seul monde
5. Zone.js peut coexister — migrer progressivement, pas tout d'un coup
6. input() dans un computed() = dépendance réelle / @Input() dans computed() = non
7. toSignal() gère le désabonnement — ne pas ajouter takeUntilDestroyed en plus
8. untracked()        pour lire sans s'abonner dans un effect()
```

