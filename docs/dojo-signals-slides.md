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

---

## Zoneless

Une application **zoneless** fonctionne sans `zone.js`. Angular ne s'appuie plus sur le patch automatique des APIs async pour lancer la détection de changement.

En zoneless, les mises à jour doivent venir de mécanismes explicites :

- signals lus par les templates ;
- `input()` / `output()` ;
- `async` pipe ;
- appels explicites de détection si nécessaire.

Ce dojo garde `zone.js` au départ. La suppression ou la limitation de `zone.js` se traite en fin de parcours, quand les participants ont déjà compris Signals.

```
Signals résout : l'état réactif local synchrone
Zone.js résout : le déclenchement automatique de la détection après async
```

---

## Intention d'architecture du dojo

Les décisions d'architecture pédagogique sont détaillées dans `docs/adr/0001-architecture-pedagogique-dojo-signals.md`.

Le projet montre volontairement deux patterns : des Signals directement dans les composants pour apprendre les bases, puis des Signals dans des façades pour l'état partagé et les règles métier. L'asymétrie est intentionnelle : on commence simple, puis on extrait quand l'état devient plus riche ou partagé.

Le détail du code mixte pendant la migration est documenté dans l'ADR 0001.

---

## Mapping exercices / branches / fichiers

| Exercice | Branche | Concept | Fichiers principaux |
|---|---|---|---|
| 1 | `exercice-1` | `signal()` | `clients.component.ts`, `clients.component.html`, `clients.component.spec.ts` |
| 2 | `exercice-2` | `computed()` en façade | `accounts.facade.ts`, `accounts.component.ts`, `accounts.component.html`, `accounts.component.spec.ts` |
| 3 | `exercice-3` | `effect()` pour cohérence d'état | `clients.component.ts` |
| 4 | `exercice-4` | `viewChild()` + `effect()` DOM | `clients.component.ts` |
| 5 | `exercice-5` | `input()` | `account-card.component.ts` |
| 6 | `exercice-6` | `output()` | `account-list.component.ts` |
| 7 | `exercice-7` | `toSignal()` / `toObservable()` | `accounts.component.ts`, `dashboard.component.ts`, `dashboard.component.spec.ts`, `clients.component.ts` |
| 8 | `exercice-8` | `computed()` en façade | `accounts.facade.ts`, `accounts.component.ts`, `accounts.component.html` |

Les branches sont cumulatives : chaque branche ajoute uniquement la correction de son exercice par rapport à la branche précédente.

---

## Exercice 1 — `signal()`

### Définition

> Un signal est une **valeur réactive observable par Angular**. Il contient une valeur, se lit avec `()`, et Angular mémorise automatiquement les templates, `computed()` et `effect()` qui l'ont lu.

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
| État partagé entre composants via service | façade Signals ou store dédié |

---

## Exercice 2 — `computed()`

### Définition

> Un `computed` est une **valeur dérivée mémorisée**. Le calcul ne se relance que si une dépendance lue a changé depuis la dernière lecture.

```ts
readonly blockedAccountsCount = computed(() =>
  this.filteredAccounts().filter(a => a.status === 'blocked').length
);

blockedAccountsCount()  // lecture
```

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

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

### vs Zone.js

| Getter + Zone.js | `computed()` |
|---|---|
| Recalculé à chaque cycle de détection | Recalculé seulement si une dépendance change |
| Angular ignore si la valeur a changé | Angular mémorise et invalide le cache |
| Règle dans le composant | Règle dans la façade, partageable |

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

> `effect()` exécute un **effet de bord** quand les signals lus dans son corps changent. Il s'exécute automatiquement, sans appel explicite.

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

### Définition `viewChild()`

> `viewChild()` expose une **référence DOM comme un signal**. Retourne `undefined` quand l'élément est absent du DOM, `ElementRef` quand il est présent.

```ts
private readonly firstNameInput = viewChild<ElementRef>('firstNameRef');
```

### Fichier à modifier

`src/app/features/clients/pages/clients/clients.component.ts`

### Mise en contexte

Cet exercice montre un deuxième usage de `effect()` : déclencher un effet DOM quand une condition UI devient vraie. Ici, on veut placer le focus sur le champ prénom quand le formulaire d'ajout est affiché.

### Consigne

Créer un `effect()` dans le constructeur pour déclencher le focus quand le formulaire d'ajout est ouvert.

```ts
// À créer dans le constructeur
effect(() => {
  if (this.adding()) {
    this.firstNameInput()?.nativeElement.focus();
  }
});
```

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts
```

### Pourquoi `effect()` ici

Le focus n'est pas une valeur calculée : c'est une interaction avec le DOM. `effect()` est adapté parce qu'il réagit à `adding()` et à la présence réelle de l'élément exposé par `viewChild()`.

---

## Exercice 5 — `input()`

### Définition

> `input()` déclare une **entrée de composant sous forme de signal**. La valeur passée par le parent devient une dépendance réelle dans les `computed()` et `effect()`.

```ts
showStatus = input(true);              // avec valeur par défaut
account = input.required<Account>();   // requis
showStatus()                           // lecture
```

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

### Définition

> `output()` déclare un **événement sortant du composant**. L'enfant émet une intention, le parent décide quoi faire. Ce n'est pas un Observable.

```ts
selectedRequested = output<Account>();       // déclarer
this.selectedRequested.emit(account);        // émettre
(selectedRequested)="startEdit($event)"      // écouter dans le parent
```

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

> `model()` déclare une **valeur bidirectionnelle** entre parent et enfant. Il combine l'idée d'une entrée (`input`) et d'une sortie (`output`) pour des cas comme un composant de formulaire contrôlé.

```ts
value = model('');

// Parent
<app-search-box [(value)]="searchTerm" />
```

À retenir dans ce dojo : `input()` sert à recevoir une valeur, `output()` sert à émettre une intention, `model()` sert aux échanges bidirectionnels explicites.

---

## Rappel RxJS — Avant `toSignal()`

**RxJS** sert à modéliser et composer des flux de données dans le temps : HTTP, WebSocket, événements, `debounceTime`, `switchMap`, `combineLatest`, etc.

RxJS ne remplace pas Zone.js. RxJS organise les flux asynchrones ; Zone.js déclenche la détection de changement ; Signals rend l'état et ses dépendances explicites.

`toSignal()` ne remplace pas RxJS : il permet de **consommer la dernière valeur d'un Observable sous forme de signal** dans un composant.

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

### Définition

> `toSignal()` convertit un Observable en signal (dernière valeur émise, abonnement géré automatiquement). `toObservable()` expose un signal comme Observable pour brancher des opérateurs RxJS.

```ts
// Signal → Observable pour opérateurs RxJS
readonly debouncedSearch$ = toObservable(this.search).pipe(debounceTime(300));
```

### Fichiers à modifier

**7a — `toSignal()` simple** — `src/app/features/accounts/pages/accounts/accounts.component.ts`

**7b — `toSignal()` avec état de chargement** — `src/app/features/clients/pages/dashboard/dashboard.component.ts`

**7c — `toObservable()`** — `src/app/features/clients/pages/clients/clients.component.ts` *(lecture seule / bonus)*

### Progression

Cet exercice est le plus dense du dojo. Il se découpe en trois marches :

1. Convertir un Observable simple en signal.
2. Ajouter l'état `loading/error` autour d'un flux HTTP.
3. Lire `toObservable()` comme pont inverse, sans demander de modification.

Le but n'est pas de remplacer RxJS. Le but est de savoir où placer la frontière : RxJS compose le flux, `toSignal()` expose sa dernière valeur au template signal.

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

Point d'attention : ici RxJS reste utile. Le `pipe()` construit un petit état de vue unique : données, chargement et erreur.

### Lecture de la pipeline 7b

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

**7c** : lire et expliquer `debouncedSearch$` dans `ClientsComponent` (pas de modification).

Cette partie sert de consolidation. Elle montre le pont inverse : on part d'un signal local, puis on repasse en Observable uniquement parce qu'un opérateur temporel (`debounceTime`) est nécessaire.

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
npm test -- --runTestsByPath src/app/features/clients/pages/dashboard/dashboard.component.spec.ts
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

## Exercice 8 — Consolidation façade avec `computed()`

Cet exercice ne présente pas une nouvelle API. Il sert à consolider l'architecture : une règle métier dérivée doit vivre au bon endroit, avec un nom explicite et une surface testable.

### Définition

> Exposer une **règle métier dérivée** dans la façade sous forme de `computed()` plutôt que de calculer en ligne dans le template ou le composant.

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

Après l'interop RxJS, on revient à un geste simple mais structurant : placer la logique dérivée dans la façade. C'est le lien avec l'objectif architectural du dojo : des composants plus lisibles, une façade qui porte l'état partagé, et des règles métier nommées.

### vs Zone.js / vs RxJS

| Règle dans le template ou le composant | `computed()` dans la façade |
|---|---|
| Logique inline, intention illisible | Nom qui exprime l'intention métier |
| Dupliquée si plusieurs composants en ont besoin | Partageable depuis la façade |
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

Les conventions d'usage des primitives Signals et la décision de ne pas migrer vers
le mode zoneless sont détaillées dans `docs/adr/0002-conventions-usage-signals-et-detection-changement.md`.

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

