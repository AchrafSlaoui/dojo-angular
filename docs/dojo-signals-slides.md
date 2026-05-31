# Angular Signals — Support de présentation dojo

---

## Avant de commencer — Le problème que Signals résout

Angular avant Signals reposait sur **Zone.js** : une librairie qui patche les APIs du navigateur
(`setTimeout`, `Promise`, `addEventListener`…) pour détecter automatiquement les changements
et déclencher un re-render du composant entier.

```
Zone.js : un événement se produit → Angular re-rend TOUT le composant
Signals  : un signal change       → Angular re-rend UNIQUEMENT ce qui lit ce signal
```

**RxJS** résolvait un autre problème : coordonner des flux de données asynchrones
(HTTP, WebSocket, timer, combineLatest…). Il reste pertinent pour ces cas.

```
Signals résout : l'état réactif local synchrone
RxJS résout    : les flux asynchrones et les combinaisons dans le temps
```

---

## Zone.js — Comprendre, limiter, supprimer

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
Angular lance un cycle de détection et parcourt **tous les composants**.

```ts
// Zone.js seul — Angular re-rend TOUT le composant après le setTimeout
setTimeout(() => {
  this.name = 'Alice';
}, 1000);

// Signals + Zone.js encore présent (cas de ce projet, OnPush)
setTimeout(() => {
  this.name.set('Alice'); // Zone.js déclenche encore un cycle,
}, 1000);                 // mais seuls les lecteurs de name() sont re-rendus

// Signals + Zoneless (Angular 18+)
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

---

### Cas 2 — Supprimer Zone.js avec le mode Zoneless (Angular 18+)

**1. `app.config.ts` :**

```ts
// Avant
provideZoneChangeDetection({ eventCoalescing: true })

// Après
provideExperimentalZonelessChangeDetection()
```

**2. `angular.json` :**

```json
// Avant
"polyfills": ["zone.js"]

// Après
"polyfills": []
```

---

### Les 3 états d'une app Angular

```
                  Zone.js présent            Zone.js supprimé
                  ──────────────────────     ────────────────────────
Sans OnPush   →   Re-render global            Impossible — rien ne
                  à chaque async              déclencherait de re-render

Avec OnPush   →   Cycle global lancé,    →   Mode Zoneless
+ Signals         seuls les composants        Seul .set() déclenche
                  dirty sont re-rendus        un re-render ciblé
```
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

> Un signal est une **valeur réactive primitive**. Angular suit qui le lit et ne re-rend que ces lecteurs.

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

### vs RxJS

| `BehaviorSubject` | `signal()` |
|---|---|
| `.subscribe()` obligatoire | Lecture avec `()` |
| Désabonnement à gérer | Pas de désabonnement |
| Push vers abonnés | Pull au moment du rendu |
| Adapté aux flux async | Adapté à l'état UI synchrone |

### Quand utiliser `signal()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| État UI local : booléen, texte, page courante | `signal()` |
| Valeur calculée à partir d'autres signals | `computed()` — pas `signal()` |
| Valeur émise par un Observable HTTP ou de route | `toSignal()` |
| État partagé entre composants sans service | `BehaviorSubject` ou store |

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

### vs RxJS

| `combineLatest` + `map` | `computed()` |
|---|---|
| Observable qui émet | Valeur synchrone mémorisée |
| `async pipe` ou `.subscribe()` | Lecture directe avec `()` |
| Push à chaque changement | Pull — calculé seulement si lu |
| Adapté aux combinaisons dans le temps | Adapté aux dérivations synchrones pures |

### Quand utiliser `computed()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Total, compteur, libellé dérivé d'autres signals | `computed()` |
| Règle qui dépend du temps (debounce, delay) | `pipe` RxJS — `computed()` est synchrone |
| Calcul déclenché par un Observable | `pipe(map(...))` RxJS puis `toSignal()` |
| Effet de bord (appel HTTP, log, focus) | `effect()` — pas `computed()` |

---

## Exercice 3 — `effect()` + `viewChild()`

### Fichier à modifier

`src/app/features/clients/pages/clients/clients.component.ts`

### Consigne

**Partie 1** : remplacer l'appel impératif `this.clampCurrentPage()` par un `effect()` dans le constructeur.

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

**Partie 2** : conditionner le focus sur `adding()` dans l'effet `viewChild` existant.

```ts
// Avant
effect(() => { this.firstNameInput()?.nativeElement.focus(); });

// Après
effect(() => { if (this.adding()) this.firstNameInput()?.nativeElement.focus(); });
```

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts
```

### Définition `effect()`

> `effect()` exécute un **effet de bord** quand les signals lus dans son corps changent.
> Il s'exécute automatiquement, sans appel explicite.

### Définition `viewChild()`

> `viewChild()` expose une **référence DOM comme un signal**. Retourne `undefined` quand
> l'élément est absent du DOM, `ElementRef` quand il est présent.

```ts
private readonly firstNameInput = viewChild<ElementRef>('firstNameRef');
```

### vs Zone.js

| Appel impératif après mutation | `effect()` |
|---|---|
| On doit penser à appeler la méthode | Déclenché automatiquement |
| Logique dispersée dans plusieurs méthodes | Logique centralisée dans l'effet |
| Bug si on oublie l'appel | Impossible d'oublier — l'effet observe |

### vs RxJS

| `tap()` / `switchMap()` dans un pipe | `effect()` |
|---|---|
| Déclenché par une émission Observable | Déclenché par un changement de signal |
| Reste dans le contexte Observable | Fonctionne directement dans la classe |
| Adapté aux flux transformés | Adapté aux effets sur état local |

### Quand utiliser `effect()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Titre du document, focus, scroll après changement d'état | `effect()` |
| Correction d'un état cohérent (clamping, reset) | `effect()` |
| Chargement HTTP déclenché par un signal | `effect()` |
| Valeur calculée à partir d'autres signals | `computed()` — pas `effect()` |
| Effet déclenché par un Observable | `tap()` RxJS dans le pipe |

---

## Exercice 4 — `input()`

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

### vs RxJS

| `@Input()` + `ngOnChanges` + `Subject` | `input()` |
|---|---|
| `ngOnChanges` requis pour détecter le changement | Changement détecté automatiquement |
| `.next()` manuel sur le Subject | Pas de plomberie |
| Plusieurs fichiers impliqués | Déclaration en une ligne |

### Quand utiliser `input()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Entrée lue dans un `computed()` ou `effect()` | `input()` |
| Entrée requise sans valeur par défaut | `input.required<T>()` |
| Entrée legacy dans un composant non migré | `@Input()` acceptable |
| Valeur bidirectionnelle parent ↔ enfant | `model()` (Angular 17.2+) |

---

## Exercice 5 — `output()`

### Fichier à modifier

`src/app/features/accounts/components/account-list/account-list.component.ts`

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
| Hérite de `Subject` RxJS | Pas d'Observable interne |
| `.subscribe()` possible depuis l'extérieur | Non subscribable depuis l'extérieur |
| Zone.js déclenche détection après l'émission | Angular notifie directement le parent |

### vs RxJS

| `Subject` exposé publiquement | `output()` |
|---|---|
| Consommable depuis n'importe où | Consommable uniquement par le parent direct |
| Couplages implicites possibles | Contrat explicite du composant |
| Adapté à un bus d'événements global | Adapté à la communication parent-enfant |

### Quand utiliser `output()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Événement vers le parent direct | `output()` |
| Événement global ou cross-composant | `Subject` dans un service |
| Flux avec opérateurs RxJS (debounce, merge…) | `Subject` dans le composant |
| Valeur bidirectionnelle entrée + sortie | `model()` (Angular 17.2+) |

---

## Exercice 6 — `toSignal()` + `toObservable()`

### Fichiers à modifier

**Partie 1** — `src/app/features/accounts/pages/accounts/accounts.component.ts`

**Partie 2** — `src/app/features/clients/pages/dashboard/dashboard.component.ts`

**Partie 3** — `src/app/features/clients/pages/clients/clients.component.ts` *(lecture seule — démo)*

### Consigne

**Partie 1** : remplacer la souscription manuelle à `paramMap` par `toSignal()`.

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

**Partie 2** : remplacer `firstValueFrom()` + états manuels par `toSignal()` + pipe RxJS.

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

**Partie 3** : lire et expliquer `debouncedSearch$` dans `ClientsComponent` (pas de modification).

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

## Exercice 7 — Refactoring facade avec `computed()`

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

## Règles à retenir pendant le dojo

```
1. computed()   ne fait jamais d'appel HTTP — calcul pur uniquement
2. effect()     n'expose jamais de valeur    — effets de bord uniquement
3. L'enfant émet une INTENTION, le parent exécute l'ACTION
4. Ne pas bridger signal ↔ RxJS systématiquement — rester dans un seul monde
5. Zone.js peut coexister — migrer progressivement, pas tout d'un coup
6. input() dans un computed() = dépendance réelle / @Input() dans computed() = non
7. toSignal() gère le désabonnement — ne pas ajouter takeUntilDestroyed en plus
```
