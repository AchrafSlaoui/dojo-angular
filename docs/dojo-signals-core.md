# Angular 21 Signals — Support de présentation dojo (parcours essentiel)

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
| Événement async (`setTimeout`, `Promise`, XHR…) | Tout l'arbre | Cycle lancé, mais composant OnPush vérifié seulement s'il est marqué dirty | Aucun déclencheur automatique |
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

## Primitive Lab

La page `/primitive-lab` permet d'expérimenter les problèmes décrits dans les exercices avant de modifier le code métier.

Chaque carte isole une primitive ou une API Angular : le cas classique montre le risque, puis la version Signals montre le comportement attendu.

---

## Mapping exercices / branches / fichiers

| Exercice | Branche | Concept | Fichiers principaux |
|---|---|---|---|
| 1 | `exercice-1` | `signal()` | `clients.component.ts`, `clients.component.html`, `clients.component.spec.ts` |
| 2 | `exercice-2` | `computed()` en façade | `accounts.facade.ts`, `accounts.component.ts`, `accounts.component.html`, `accounts.component.spec.ts` |
| 3 | `exercice-3` | `effect()` pour cohérence d'état | `clients.component.ts` |
| 4 | `exercice-5` | `input()` | `account-card.component.ts` |
| 5 | `exercice-6` | `output()` | `account-list.component.ts` |
| 6 | `exercice-7` | `linkedSignal()` | `accounts.component.ts` |

Les branches sont cumulatives : chaque branche intègre les solutions des exercices précédents.

La branche de départ de l'exercice 4 est `exercice-5` — elle intègre déjà les exercices intermédiaires non traités dans ce parcours.

---

## Exercice 1 — `signal()`

### Problème

Un état local reste une propriété TypeScript ordinaire. Il peut piloter le template, mais Angular ne sait pas que cette valeur est une source réactive. La modification peut donc être ignorée si aucun cycle de détection ne repasse sur le composant : par exemple avec `OnPush`, en zoneless, ou après une mutation déclenchée hors d'un événement template suivi par Angular.

Reproduit dans `signal-lab-card.component.ts` :

```ts
classicAdding = false; // propriété TypeScript ordinaire

launchClassicTimer(): void {
  window.setTimeout(() => {
    this.classicAdding = true;
    // Angular OnPush ne voit pas ce changement : la vue reste figée à false
    // → cliquer "Réveiller Angular" est nécessaire pour voir la mise à jour
  }, 1000);
}
```

### Définition

> `signal()` est une **primitive Signal** : une valeur réactive observable par Angular. Elle contient une valeur, se lit avec `()`, et Angular mémorise automatiquement les templates, `computed()` et `effect()` qui l'ont lue.


**À retenir :** utilisez `signal()` pour un état local synchrone qui doit être lu par le template ou servir de dépendance à d'autres primitives Signals.

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

### Problème

Une valeur dérivée finit souvent dans un getter, une méthode ou directement dans le template. Elle peut être recalculée trop souvent, être dupliquée à plusieurs endroits, ou rester difficile à identifier comme règle métier.

Reproduit dans `computed-lab-card.component.ts` :

```ts
private computeBlockedCount(): number {
  this.functionCallCount += 1;
  return this.accounts().filter(a => a.status === 'blocked').length;
  // filtre la liste entière à chaque appel — 5 lectures = 5 calculs
}
```

### Définition

> `computed()` est une **primitive Signal** : une valeur dérivée mémorisée. Le calcul ne se relance que si une dépendance lue a changé depuis la dernière lecture.

**À retenir :** utilisez `computed()` pour une valeur pure dérivée d'autres signals. Si le code déclenche un effet de bord, ce n'est pas un `computed()`.

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

## Exercice 3 — `effect()` + `untracked()` pour synchroniser un état

### Problème

Une règle de synchronisation peut être dispersée dans plusieurs handlers, hooks de cycle de vie ou subscriptions. Le code fonctionne tant qu'on pense à appeler la bonne méthode partout, mais il devient fragile dès qu'une nouvelle mutation est ajoutée.

Reproduit dans `effect-lab-card.component.ts` : supprimer des lignes sans recaler `classicPage` laisse l'état en "page 2 / 1".

```ts
classicRows = ['Ada', 'Grace', 'Alan'];
classicPage = 2;

removeRows(): void {
  this.classicRows = ['Ada'];
  // classicPage oublié : reste à 2 alors que la liste n'a plus qu'une page
  // → état invalide visible dans le lab : "page 2 / 1"
}
```

### Définition `effect()`

> `effect()` est une **primitive Signal** : elle exécute un effet de bord quand les signals lus dans son corps changent. Elle s'exécute automatiquement, sans appel explicite.


**À retenir :** utilisez `effect()` pour synchroniser avec quelque chose qui n'est pas une valeur calculée : DOM, stockage, titre de page, recalage d'état, log, intégration externe.

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

## Exercice 4 — `input()`

### Problème

Une entrée `@Input()` classique peut être utilisée dans le template, mais si elle est lue dans un `computed()` ou un `effect()`, elle ne devient pas une dépendance signal. Une valeur dérivée peut donc rester basée sur une ancienne lecture ou demander du code de synchronisation en plus.

Reproduit dans `input-lab-card.component.ts` (`LabInputChildComponent`) :

```ts
@Input() classicShowDetails = true;

readonly classicLabel = computed(() =>
  this.classicShowDetails ? 'details visibles' : 'details masques'
);
```

`computed()` ne suit que les lectures de signals — celles qui s'écrivent `this.x()`. Ici, `classicShowDetails` est un `@Input()` ordinaire : le lire ne crée aucune dépendance. Angular considère ce `computed()` comme n'ayant rien à surveiller, et met son résultat en cache définitivement.

Conséquence : le parent bascule `classicShowDetails` de `true` à `false`, mais `classicLabel()` retourne toujours `'details visibles'` — la valeur calculée lors de la première exécution.

### Définition

> `input()` est une **API composant Angular** : elle déclare une entrée de composant sous forme de signal. La valeur passée par le parent devient une dépendance réelle dans les `computed()` et `effect()`.

**À retenir :** utilisez `input()` quand une entrée doit participer à une dérivation ou à une réaction signal.

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

### Quand utiliser `input()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Entrée lue dans un `computed()` ou `effect()` | `input()` |
| Entrée requise sans valeur par défaut | `input.required<T>()` |
| Entrée legacy dans un composant non migré | `@Input()` acceptable |
| Valeur bidirectionnelle parent ↔ enfant | `model()` |

---

## Exercice 5 — `output()`

### Problème

`@Output()` + `EventEmitter` fonctionne, mais l'API mélange l'idée d'événement composant avec une forme qui ressemble à un flux RxJS. Cela peut encourager à traiter une sortie simple comme une source de stream applicatif.

Pattern classique :

```ts
@Output() selectedRequested = new EventEmitter<Account>();
// EventEmitter hérite de Subject (RxJS)
// → selectedRequested.pipe(...) et .subscribe(...) accessibles depuis l'extérieur
// → l'API expose un flux là où seule une intention de composant est nécessaire
```

### Définition

> `output()` est une **API composant Angular** : elle déclare un événement sortant du composant. L'enfant émet une intention, le parent décide quoi faire. Ce n'est pas un Observable.

**À retenir :** utilisez `output()` pour signaler une action ou une intention vers le parent direct, pas pour partager un état.

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

### Quand utiliser `output()` — et quand rester ailleurs

| Situation | Outil |
|---|---|
| Événement vers le parent direct | `output()` |
| Événement global ou cross-composant | Service dédié |
| Valeur bidirectionnelle entrée + sortie | `model()` |

---

## Exercice 6 — `linkedSignal()`

### Problème

Pour un formulaire prérempli depuis une sélection, `computed()` est trop rigide car il est en lecture seule, tandis qu'un `signal()` simple peut se désynchroniser si on oublie de le réinitialiser quand la sélection change.

Reproduit dans `linked-signal-lab-card.component.ts` :

```ts
readonly selected = signal<DemoPerson>(PERSONS[0]);

// computed() — se synchronise automatiquement, mais lecture seule
readonly computedName = computed(() => this.selected().name);
// → l'utilisateur ne peut pas modifier cette valeur dans un champ input
// computedName.set('Alice modifiée'); // ← ERREUR : computed() est en lecture seule
```

### Définition

> `linkedSignal()` est une **primitive Signal** : elle crée un signal writable dérivé d'un autre signal. Contrairement à `computed()` qui est en lecture seule, sa valeur peut être modifiée par `.set()` ou `.update()`. Elle est automatiquement recalculée quand la source change.

**À retenir :** utilisez `linkedSignal()` quand une valeur vient d'une source réactive mais doit ensuite être éditable localement.

```ts
readonly value = linkedSignal(() => this.source());
value()        // lecture
value.set(x)   // écriture possible — contrairement à computed()
// Quand source() change → value() est recalculée depuis la source
```

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

## Récapitulatif — Primitives Signals

| Primitive | Rôle | Writable | Recalcul automatique |
|---|---|---|---|
| `signal()` | État local | ✓ `.set()` / `.update()` | — |
| `computed()` | Valeur dérivée mémorisée | ✗ lecture seule | Quand une dépendance signal change |
| `effect()` | Effet de bord réactif | — | Quand une dépendance signal change |
| `linkedSignal()` | Valeur dérivée ET éditable | ✓ `.set()` / `.update()` | Quand la source change |

### APIs composant

| API | Rôle | Remplace |
|---|---|---|
| `input()` | Entrée réactive (signal en lecture) | `@Input()` |
| `output()` | Événement sortant (intention composant) | `@Output()` + `EventEmitter` |

---

## Clôture du dojo — Règles à retenir

Les conventions d'usage des APIs Signals utilisées ici et la décision de ne pas migrer vers
le mode zoneless sont détaillées dans `docs/adr/0002-conventions-usage-signals-et-detection-changement.md`.

```
1. computed()    ne fait jamais d'appel HTTP — calcul pur uniquement
2. effect()      n'expose jamais de valeur    — effets de bord uniquement
3. L'enfant émet une INTENTION, le parent exécute l'ACTION
4. input() dans un computed() = dépendance réelle / @Input() dans computed() = non
5. Zone.js peut coexister — migrer progressivement, pas tout d'un coup
6. untracked()   pour lire sans s'abonner dans un effect()
```
