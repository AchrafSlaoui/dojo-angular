# Angular 21 Signals — Support de présentation dojo

---

## Avant de commencer — Zone.js et Signals

Ce dojo se déroule en **Angular 21**. Le projet garde volontairement `zone.js`
et `OnPush` pour montrer une migration progressive vers Signals, sans basculer
toute l'application en zoneless dès le départ.

### Rappel Zone.js

**Zone.js** aide Angular à savoir qu'un événement asynchrone a eu lieu.
Il patche les APIs du navigateur (`setTimeout`, `Promise`, `addEventListener`,
`XMLHttpRequest`, etc.) puis prévient Angular qu'un cycle de détection doit être lancé.

Zone.js ne modélise pas l'état de l'application : il sert surtout à **déclencher**
la détection de changement.

- Définition : librairie qui intercepte les APIs async du navigateur.
- Rôle : prévenir Angular qu'un cycle de détection doit être lancé.
- Limite : ne décrit pas l'état, il déclenche seulement la vérification.

### Définition de Signal et problème résolu

Un **signal** est une valeur réactive observable par Angular. Il contient une valeur,
se lit avec `()`, et Angular mémorise automatiquement les templates, `computed()`
et `effect()` qui l'ont lu.

Le problème résolu par Signals : rendre l'état local explicite et permettre à Angular
de savoir précisément quelles vues ou valeurs dérivées dépendent de cet état.

- Définition : valeur réactive lue avec `()`.
- Rôle : mémoriser les lecteurs dépendants.
- Problème résolu : état explicite et mises à jour plus ciblées.

```
Zone.js : un événement async se produit → Angular lance la détection
Signals : une valeur change             → Angular connaît les lecteurs dépendants
```

```
Signals résout : l'état réactif local synchrone
Zone.js résout : le déclenchement automatique de la détection après async
```

---

## Intention d'architecture du dojo

Les decisions d'architecture pedagogique sont detaillees dans
`docs/adr/0001-architecture-pedagogique-dojo-signals.md`.

Le projet montre volontairement **deux patterns Signals**.

### 1. Signals directement dans les composants

`ClientsComponent` et `DashboardComponent` montrent les bases :

- `signal()` pour l'état local ;
- `computed()` pour les valeurs dérivées ;
- `effect()` pour les effets de bord simples ;
- lecture directe dans le template avec `signal()`.

### 2. Signals extraits dans une facade

`AccountsFacade` et `MovementsFacade` montrent l'étape avancée :

- état partagé entre plusieurs composants ;
- logique métier encapsulée ;
- exposition en lecture seule avec `asReadonly()` ;
- orchestration API + notifications + confirmations.

> L'asymétrie est intentionnelle : on commence simple dans un composant,
> puis on extrait vers une facade quand l'état devient plus riche ou partagé.

---

## Lecture guidée — code mixte pendant la migration

Voir aussi l'ADR 0001 pour la justification de ce choix.

Le projet contient volontairement du code mixte : certains états sont déjà des
signals, d'autres restent des propriétés classiques.

```ts
// ClientCardComponent
editMode = false;
editModel: ClientUpdate | null = null;

// ClientDetailComponent
addingAccount = false;
readonly mutating = this.accountsFacade.mutating;

// AccountsComponent
adding = false;
```

Dans les templates, cela donne aussi un mélange visible :

```html
@if (addingAccount) { ... }
@if (mutating()) { ... }
```

Ce n'est pas une incohérence. C'est le reflet d'une migration progressive :

- `mutating()` vient d'une facade Signals et peut être partagé entre composants ;
- `addingAccount`, `adding`, `editMode` et `editModel` sont des états locaux transitoires ;
- avec `zone.js` + `OnPush`, un clic template marque le composant à vérifier ;
- convertir en signal devient intéressant quand l'état est lu par `computed()`,
  `effect()`, plusieurs composants, ou quand on veut expliciter ses dépendances.

À retenir : dans ce dojo, on ne convertit pas tout mécaniquement. On convertit les
états qui rendent le modèle réactif plus clair.

L'exercice 1 convertit `adding` dans `ClientsComponent` pour apprendre `signal()`.
Le `adding` de `AccountsComponent` reste volontairement classique : il illustre
qu'une migration peut être progressive quand l'état reste local et simple.

---

## Mapping exercices / branches / fichiers

| Exercice | Branche | Concept | Fichiers principaux |
|---|---|---|---|
| 1 | `exercice-1` | `signal()` | `clients.component.ts`, `clients.component.html`, `clients.component.spec.ts` |
| 2 | `exercice-2` | `computed()` en facade | `accounts.facade.ts`, `accounts.component.ts`, `accounts.component.html`, `accounts.component.spec.ts` |
| 3 | `exercice-3` | `effect()` pour cohérence d'état | `clients.component.ts` |
| 4 | `exercice-4` | `viewChild()` + `effect()` DOM | `clients.component.ts` |
| 5 | `exercice-5` | `input()` | `account-card.component.ts` |
| 6 | `exercice-6` | `output()` | `account-list.component.ts` |
| 7 | `exercice-7` | `toSignal()` / `toObservable()` | `accounts.component.ts`, `dashboard.component.ts`, `dashboard.component.spec.ts`, `clients.component.ts` |
| 8 | `exercice-8` | `computed()` en facade | `accounts.facade.ts`, `accounts.component.ts`, `accounts.component.html` |

Les branches sont cumulatives : chaque branche ajoute uniquement la correction de
son exercice par rapport à la branche précédente.

---

## Exercice 1 — `signal()`

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

### Définition

> Un signal est une **valeur réactive observable par Angular**. Il contient une valeur,
> se lit avec `()`, et Angular mémorise automatiquement les templates, `computed()`
> et `effect()` qui l'ont lu.

Quand la valeur change, Angular sait précisément quelles dépendances invalider :
les valeurs dérivées sont recalculées si nécessaire et les vues concernées sont mises à jour.

`signal()` crée un signal mutable. `computed()` crée un signal dérivé en lecture seule.
`effect()` observe des signals, mais n'est pas un signal.

```ts
readonly adding = signal(false);  // déclarer
this.adding.set(true);            // écrire
this.adding.update(v => !v);      // mettre à jour depuis la valeur courante
adding()                          // lire (template ou TS)
```

### vs Zone.js

| Zone.js + propriété classique | `signal()` |
|---|---|
| Angular re-rend tout le composant à chaque cycle | Re-rend seulement les lecteurs du signal |
| Détection déclenchée par Zone.js après chaque async | Détection déclenchée par `.set()` |
| Rien à déclarer — Zone.js devine | Déclarer `signal()` — Angular sait exactement |

### Quand utiliser `signal()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| État UI local : booléen, texte, page courante | `signal()` |
| État local transitoire manipulé seulement par des handlers template | Propriété classique acceptable pendant la migration |
| Valeur calculée à partir d'autres signals | `computed()` — pas `signal()` |
| Valeur issue d'une route ou d'un appel HTTP | `toSignal()` |
| État partagé entre composants via service | facade Signals ou store dédié |

---

## Exercice 2 — `computed()`

### Fichiers à modifier

- `src/app/features/accounts/services/accounts.facade.ts`
- `src/app/features/accounts/pages/accounts/accounts.component.ts`
- `src/app/features/accounts/pages/accounts/accounts.component.html`

### Consigne

Transformer le getter `blockedAccountsCount` en `computed()` dans la facade, puis exposer le signal dans le composant.

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

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

### Définition

> Un `computed` est une **valeur dérivée mémorisée**. Le calcul ne se relance que si
> une dépendance lue a changé depuis la dernière lecture.

```ts
readonly blockedAccountsCount = computed(() =>
  this.filteredAccounts().filter(a => a.status === 'blocked').length
);

blockedAccountsCount()  // lecture
```

### vs Zone.js

| Getter + Zone.js | `computed()` |
|---|---|
| Recalculé à chaque cycle de détection | Recalculé seulement si une dépendance change |
| Angular ignore si la valeur a changé | Angular mémorise et invalide le cache |
| Règle dans le composant | Règle dans la facade, partageable |

### Quand utiliser `computed()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Total, compteur, libellé dérivé d'autres signals | `computed()` |
| Règle qui dépend du temps (debounce, delay) | Flux asynchrone — `computed()` est synchrone |
| Calcul déclenché par une source asynchrone | Source asynchrone puis `toSignal()` |
| Effet de bord (appel HTTP, log, focus) | `effect()` — pas `computed()` |

---

## Exercice 3 — `effect()` pour synchroniser un état

### Fichier à modifier

`src/app/features/clients/pages/clients/clients.component.ts`

### Consigne

Remplacer l'appel impératif `this.clampCurrentPage()` par un `effect()` dans le constructeur.

```ts
// Ajouter dans le constructeur
effect(() => {
  const clamped = this.pageSlice().page;
  if (clamped !== this.page()) this.page.set(clamped);
});

// Supprimer dans deleteClient()
this.clampCurrentPage(); // ← retirer cette ligne

// Supprimer la méthode
private clampCurrentPage(): void { ... }
```

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts
```

### Définition `effect()`

> `effect()` exécute un **effet de bord** quand les signals lus dans son corps changent.
> Il s'exécute automatiquement, sans appel explicite.

### vs Zone.js

| Appel impératif après mutation | `effect()` |
|---|---|
| On doit penser à appeler la méthode | Déclenché automatiquement |
| Logique dispersée dans plusieurs méthodes | Logique centralisée dans l'effet |
| Bug si on oublie l'appel | Moins de risque — l'effet observe les dépendances |

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

### Fichier à modifier

`src/app/features/clients/pages/clients/clients.component.ts`

### Mise en contexte

Cet exercice montre un deuxième usage de `effect()` : déclencher un effet DOM quand
une condition UI devient vraie. Ici, on veut placer le focus sur le champ prénom
quand le formulaire d'ajout est affiché.

### Définition `viewChild()`

> `viewChild()` expose une **référence DOM comme un signal**. Retourne `undefined` quand
> l'élément est absent du DOM, `ElementRef` quand il est présent.

```ts
private readonly firstNameInput = viewChild<ElementRef>('firstNameRef');
```

### Consigne

Conditionner le focus sur `adding()` dans l'effet `viewChild` existant.

```ts
// Avant
effect(() => { this.firstNameInput()?.nativeElement.focus(); });

// Après
effect(() => { if (this.adding()) this.firstNameInput()?.nativeElement.focus(); });
```

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts
```

### Pourquoi `effect()` ici

Le focus n'est pas une valeur calculée : c'est une interaction avec le DOM.
`effect()` est adapté parce qu'il réagit à `adding()` et à la présence réelle de
l'élément exposé par `viewChild()`.

---

## Exercice 5 — `input()`

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

> Point clé : `@Input()` dans un `computed()` ne crée **pas** de dépendance réelle.
> `input()` dans un `computed()` **est** une dépendance réelle.

```bash
npm test -- --runTestsByPath src/app/features/accounts/components/account-card/account-card.component.spec.ts
```

### Définition

> `input()` déclare une **entrée de composant sous forme de signal**. La valeur passée
> par le parent devient une dépendance réelle dans les `computed()` et `effect()`.

```ts
showStatus = input(true);              // avec valeur par défaut
account = input.required<Account>();   // requis
showStatus()                           // lecture
```

### vs Zone.js

| `@Input()` classique | `input()` |
|---|---|
| Propriété TS mise à jour par Angular | Signal mis à jour par Angular |
| Lu dans `computed()` sans créer de dépendance | Lu dans `computed()` → dépendance réelle |
| Zone.js déclenche détection après chaque cycle | Re-render seulement si la valeur change |

### Quand utiliser `input()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Entrée lue dans un `computed()` ou `effect()` | `input()` |
| Entrée requise sans valeur par défaut | `input.required<T>()` |
| Entrée legacy dans un composant non migré | `@Input()` acceptable |
| Valeur bidirectionnelle parent ↔ enfant | `model()` (voir parenthèse après `output()`) |

---

## Exercice 6 — `output()`

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

Elles servent de modèle local. L'exercice consiste à aligner la dernière sortie
legacy, `selectedRequested`, sur le même style.

### Consigne

Transformer `@Output() selectedRequested = new EventEmitter<Account>()` en `output()`.
Retirer `EventEmitter` et `Output` des imports.

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

### Définition

> `output()` déclare un **événement sortant du composant**. L'enfant émet une intention,
> le parent décide quoi faire. Ce n'est pas un Observable.

```ts
selectedRequested = output<Account>();       // déclarer
this.selectedRequested.emit(account);        // émettre
(selectedRequested)="startEdit($event)"      // écouter dans le parent
```

### vs Zone.js

| `@Output()` + `EventEmitter` | `output()` |
|---|---|
| Hérite historiquement d'un mécanisme de flux | Pas d'Observable interne |
| Souvent détourné comme flux applicatif | Contrat pensé pour le parent direct |
| Zone.js déclenche détection après l'émission | Angular notifie directement le parent |

### Quand utiliser `output()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Événement vers le parent direct | `output()` |
| Événement global ou cross-composant | Service dédié |
| Flux avec opérateurs temporels | Flux dédié, pas `output()` |
| Valeur bidirectionnelle entrée + sortie | `model()` (voir ci-dessous) |

### Parenthèse rapide — `model()`

> `model()` déclare une **valeur bidirectionnelle** entre parent et enfant.
> Il combine l'idée d'une entrée (`input`) et d'une sortie (`output`) pour des cas
> comme un composant de formulaire contrôlé.

```ts
value = model('');

// Parent
<app-search-box [(value)]="searchTerm" />
```

À retenir dans ce dojo : `input()` sert à recevoir une valeur, `output()` sert à
émettre une intention, `model()` sert aux échanges bidirectionnels explicites.

---

## Rappel RxJS — Avant `toSignal()`

**RxJS** sert à modéliser et composer des flux de données dans le temps :
HTTP, WebSocket, événements, `debounceTime`, `switchMap`, `combineLatest`, etc.

RxJS ne remplace pas Zone.js. RxJS organise les flux asynchrones ; Zone.js déclenche
la détection de changement ; Signals rend l'état et ses dépendances explicites.

`toSignal()` ne remplace pas RxJS : il permet de **consommer la dernière valeur
d'un Observable sous forme de signal** dans un composant.

```
RxJS    : un flux émet dans le temps → on compose/transforme ce flux
toSignal: Observable → Signal        → on lit la dernière valeur avec ()
```

```ts
readonly clientId = toSignal(
  this.route.paramMap.pipe(map(params => params.get('id'))),
  { initialValue: null }
);

clientId() // lecture côté composant/template
```

---

## Exercice 7 — Interop RxJS progressive

### Fichiers à modifier

**7a — `toSignal()` simple** — `src/app/features/accounts/pages/accounts/accounts.component.ts`

**7b — `toSignal()` avec état de chargement** — `src/app/features/clients/pages/dashboard/dashboard.component.ts`

**7c — `toObservable()`** — `src/app/features/clients/pages/clients/clients.component.ts` *(lecture seule / bonus)*

### Progression

Cet exercice est le plus dense du dojo. Il se découpe en trois marches :

1. Convertir un Observable simple en signal.
2. Ajouter l'état `loading/error` autour d'un flux HTTP.
3. Lire `toObservable()` comme pont inverse, sans demander de modification.

Le but n'est pas de remplacer RxJS. Le but est de savoir où placer la frontière :
RxJS compose le flux, `toSignal()` expose sa dernière valeur au template signal.

### Consigne

**7a** : remplacer la souscription manuelle à `paramMap` par `toSignal()`.

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

**7b** : remplacer `firstValueFrom()` + états manuels par `toSignal()` + pipe RxJS.

Point d'attention : ici RxJS reste utile. Le `pipe()` construit un petit état de vue
unique : données, chargement et erreur.

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

La méthode `reload()` disparaît : le chargement initial est porté par le signal
créé avec `toSignal()`.

**7c** : lire et expliquer `debouncedSearch$` dans `ClientsComponent` (pas de modification).

Cette partie sert de consolidation. Elle montre le pont inverse :
on part d'un signal local, puis on repasse en Observable uniquement parce qu'un
opérateur temporel (`debounceTime`) est nécessaire.

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
npm test -- --runTestsByPath src/app/features/clients/pages/dashboard/dashboard.component.spec.ts
```

### Définition

> `toSignal()` convertit un Observable en signal (dernière valeur émise, abonnement géré automatiquement).
> `toObservable()` expose un signal comme Observable pour brancher des opérateurs RxJS.

```ts
// Signal → Observable pour opérateurs RxJS
readonly debouncedSearch$ = toObservable(this.search).pipe(debounceTime(300));
```

### vs Zone.js

| Observable + `.subscribe()` | `toSignal()` |
|---|---|
| `takeUntilDestroyed` requis | Abonnement géré automatiquement |
| Copie manuelle dans un signal | `toSignal()` crée et alimente le signal |
| Zone.js détecte l'émission, re-rend tout | Angular re-rend seulement les dépendants du signal |

### vs RxJS

| `BehaviorSubject` exposé | `toSignal()` |
|---|---|
| Source mutable, `.next()` depuis plusieurs endroits | Alimenté uniquement par l'Observable source |
| Adapté à l'état partagé entre services | Adapté à consommer un Observable dans un composant |

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

## Exercice 8 — Consolidation facade avec `computed()`

Cet exercice ne présente pas une nouvelle API. Il sert à consolider l'architecture :
une règle métier dérivée doit vivre au bon endroit, avec un nom explicite et une
surface testable.

### Fichiers à modifier

- `src/app/features/accounts/services/accounts.facade.ts`
- `src/app/features/accounts/pages/accounts/accounts.component.ts`
- `src/app/features/accounts/pages/accounts/accounts.component.html`

### Consigne

Ajouter `hasActiveFilter` comme `computed()` dans la facade, l'exposer dans le composant, l'utiliser dans le template.

```ts
// accounts.facade.ts — ajouter après typeFilter
readonly hasActiveFilter = computed(() =>
  this.search().trim().length > 0 || this.typeFilter() !== 'all'
);
```

```ts
// AccountsComponent — exposer le signal de la facade
readonly hasActiveFilter = this.accountsFacade.hasActiveFilter;
```

```html
<!-- accounts.component.html — remplacer le message vide -->
{{ hasActiveFilter() ? 'Aucun compte ne correspond aux filtres.' : 'Aucun compte trouvé.' }}
```

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

### Définition

> Exposer une **règle métier dérivée** dans la facade sous forme de `computed()` plutôt que
> de calculer en ligne dans le template ou le composant.

### Pourquoi terminer par cet exercice

Après l'interop RxJS, on revient à un geste simple mais structurant : placer la
logique dérivée dans la facade. C'est le lien avec l'objectif architectural du dojo :
des composants plus lisibles, une facade qui porte l'état partagé, et des règles
métier nommées.

### vs Zone.js / vs RxJS

| Règle dans le template ou le composant | `computed()` dans la facade |
|---|---|
| Logique inline, intention illisible | Nom qui exprime l'intention métier |
| Dupliquée si plusieurs composants en ont besoin | Partageable depuis la facade |
| Non testable directement | Testable unitairement |
| Recalculée à chaque cycle Zone.js | Mémorisée, recalculée seulement si nécessaire |

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

## Clôture du dojo — Règles à retenir

```
1. computed()   ne fait jamais d'appel HTTP — calcul pur uniquement
2. effect()     n'expose jamais de valeur    — effets de bord uniquement
3. L'enfant émet une INTENTION, le parent exécute l'ACTION
4. Ne pas bridger signal ↔ RxJS systématiquement — rester dans un seul monde
5. Zone.js peut coexister — migrer progressivement, pas tout d'un coup
6. input() dans un computed() = dépendance réelle / @Input() dans computed() = non
7. toSignal() gère le désabonnement — ne pas ajouter takeUntilDestroyed en plus
```

---

## Annexe — Limiter ou supprimer Zone.js

Cette partie est une **annexe de référence**. Elle répond à la question : que devient
la détection de changement quand on limite Zone.js ou qu'on passe en mode zoneless ?

### Ce que fait Zone.js

Zone.js remplace les APIs async natives du navigateur par ses propres versions pour
intercepter chaque appel et prévenir Angular qu'un changement a peut-être eu lieu.

```ts
// Zone.js remplace silencieusement au démarrage :
window.setTimeout       → version Zone.js
window.Promise          → version Zone.js
window.fetch            → version Zone.js
window.addEventListener → version Zone.js
XMLHttpRequest          → version Zone.js
```

Quand le callback async se termine, Zone.js dit à Angular : *"quelque chose a peut-être changé"*.
Angular lance alors un cycle de détection global. Avec `OnPush`, les composants
non marqués dirty sont sautés, ce qui limite déjà le travail.

```ts
// Zone.js seul — Angular lance un cycle après le setTimeout
setTimeout(() => {
  this.name = 'Alice';
}, 1000);

// Signals + Zone.js encore présent (cas de ce projet, OnPush)
setTimeout(() => {
  this.name.set('Alice'); // Zone.js déclenche encore un cycle,
}, 1000);                 // mais seuls les lecteurs de name() sont re-rendus

// Signals + Zoneless (possible en Angular 21)
setTimeout(() => {
  this.name.set('Alice'); // setTimeout non patché — seul .set() déclenche
}, 1000);                 // le re-render sur les lecteurs de name()
```

> Zone.js espionne les APIs pour **deviner** qu'un changement a eu lieu.
> Signals **annonce** explicitement le changement.

---

### Cas 1 — Limiter le re-render par composant avec `OnPush`

`OnPush` dit à Angular : **ignore ce composant pendant un cycle de détection
sauf si une raison explicite existe**.

```ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

| Déclencheur | Re-render ? |
|---|---|
| Un `input()` signal reçoit une nouvelle valeur | Oui |
| Un `@Input()` reçoit une nouvelle référence | Oui |
| Un `async pipe` émet une valeur | Oui |
| `cdr.markForCheck()` appelé manuellement | Oui |
| Une propriété de classe classique change | **Non** |
| Un `@Input()` ou un `input()`  reçoit le même objet muté | **Non** |

> `OnPush` ne supprime pas Zone.js. Zone.js continue de déclencher des cycles globaux —
> `OnPush` fait juste que ce composant est **sauté** s'il n'est pas marqué dirty.

### Comment un composant est marqué dirty

**Dirty** = Angular doit réévaluer ce composant lors du prochain cycle de détection.

| Déclencheur | Qui marque dirty ? | Mécanisme |
|---|---|---|
| `@Input()` reçoit une nouvelle référence | Angular (interne) | Comparaison par référence à chaque cycle Zone.js |
| `input()` signal change | Angular (graphe signals) | `.set()` invalide les vues qui lisent ce signal |
| `async pipe` émet une valeur | `async pipe` lui-même | Appelle `cdr.markForCheck()` à chaque émission |
| `cdr.markForCheck()` | Le développeur | Marque le composant **et tous ses ancêtres** |
| Signal lu dans le template change | Angular (graphe signals) | `.set()` cible directement les vues concernées |

```
Zone.js + OnPush :
  Zone.js détecte un async → cycle global → Angular parcourt l'arbre
  → saute les composants non dirty → re-rend les dirty

Signals + OnPush :
  .set() → Angular sait exactement quelles vues lisent ce signal
  → marque ces vues dirty ; avec Zone.js, le cycle global peut encore exister
```

---

### Cas 2 — Supprimer Zone.js avec le mode Zoneless en Angular 21

Ce n'est pas l'objectif de ce dojo, mais c'est la suite logique une fois l'état
principal piloté par Signals.

**1. `app.config.ts` :**

```ts
// Avant
provideZoneChangeDetection({ eventCoalescing: true })

// Après
provideZonelessChangeDetection()
```

**2. `angular.json` :**

```json
// Avant
"polyfills": ["zone.js"]

// Après
"polyfills": []
```

En zoneless, Signals ne sont pas obligatoires partout, mais chaque changement
doit passer par un déclencheur connu d'Angular : `signal().set()`, `input()`,
événement template, `async pipe`, `markForCheck()`, router/forms, etc.

```ts
// Fragile en zoneless : propriété classique modifiée dans un callback async
name = 'Alice';

setTimeout(() => {
  this.name = 'Bob';
}, 1000);

// Robuste en zoneless : le signal notifie Angular explicitement
name = signal('Alice');

setTimeout(() => {
  this.name.set('Bob');
}, 1000);
```

---

### Les 3 états d'une app Angular

```
                  Zone.js présent            Zone.js supprimé
                  ──────────────────────     ────────────────────────
Sans OnPush   →   Re-render global       →    Les changements classiques
                  à chaque async              ne sont plus auto-détectés

Avec OnPush   →   Cycle global lancé,    →   Mode Zoneless
+ Signals         seuls les composants        Seul .set() déclenche
                  dirty sont re-rendus        un re-render ciblé
```
---
