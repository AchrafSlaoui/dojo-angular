# Angular 21 Signals — Support de présentation dojo

---
Angular peut recalculer des valeurs inchangées simplement parce qu’un cycle de détection s’est déclenché.

## Objectif du dojo

Ce parcours vise les usages essentiels des Signals :

- rendre un état local réactif avec `signal()` ;
- dériver une valeur sans recalcul inutile avec `computed()` ;
- synchroniser un état avec `effect()` ;
- transformer une entrée composant en dépendance signal avec `input()` ;
- gérer une valeur dérivée mais éditable avec `linkedSignal()`.

---

## Sommaire

- Rappels : Signal, Zone.js, OnPush, zoneless
- Exercices 1 à 3 : `signal()`, `computed()`, `effect()`
- Exercices 4 à 5 : `input()`, `linkedSignal()`
- Récapitulatif et règles d'usage

---

## Signal

Un **signal** est une valeur réactive observable par Angular. Il contient une valeur, se lit avec `()`, et Angular mémorise automatiquement les templates, `computed()` et `effect()` qui l'ont lu.

Signals rend l'état local explicite et permet à Angular de savoir précisément quelles vues ou valeurs dérivées dépendent de cet état.

---

## Zone.js et détection de changement

**Zone.js** aide Angular à savoir qu'un événement asynchrone a eu lieu. Il patche les APIs du navigateur (`setTimeout`, `Promise`, `addEventListener`, `XMLHttpRequest`, etc.) puis prévient Angular qu'un cycle de détection doit être lancé.

Zone.js ne modélise pas l'état de l'application : il sert surtout à **déclencher** la détection de changement après un événement.

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

```ts
import { ChangeDetectorRef, inject } from '@angular/core';

private readonly cdr = inject(ChangeDetectorRef);

// Demande une vérification au prochain cycle
this.cdr.markForCheck();

// Vérifie immédiatement cette vue et ses enfants
this.cdr.detectChanges();
```

---

## Zoneless

Une application **zoneless** fonctionne sans `zone.js` : Angular ne s'appuie plus sur le patch automatique des APIs async pour lancer la détection de changement.

En zoneless, les mises à jour doivent venir de mécanismes explicites :

- signals lus par les templates ;
- `input()` / `output()` ;
- `async` pipe ;
- appels explicites de détection si nécessaire.

En zoneless, signal et `async` pipe ne se comportent pas de la même façon : un signal met à jour uniquement ses lecteurs directs. `async` pipe appelle `markForCheck()` — le composant et ses parents sont vérifiés, le DOM est mis à jour seulement si quelque chose a effectivement changé.


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

## Mapping exercices / branches / fichiers

| Exercice | Branche | Concept | Fichiers principaux |
|---|---|---|---|
| 1 | `exercice-1` | `signal()` | `clients.component.ts`, `clients.component.html`, `clients.component.spec.ts` |
| 2 | `exercice-2` | `computed()` en façade | `accounts.facade.ts`, `accounts.component.ts`, `accounts.component.html`, `accounts.component.spec.ts` |
| 3 | `exercice-3` | `effect()` pour cohérence d'état | `clients.component.ts` |
| 4 | `exercice-4` | `input()` | `account-card.component.ts` |
| 5 | `exercice-5` | `linkedSignal()` | `accounts.component.ts` |

---

## Exercice 1 — `signal()`

<details>
<summary>Cas d’erreur illustré</summary>

Un état local en propriété TypeScript peut piloter le template, mais Angular ne le suit pas comme source réactive. Avec `OnPush`, zoneless ou une mutation async, la vue peut rester figée si aucune vérification n'est déclenchée.

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

</details>

### API Signal à utiliser

> `signal()` est une **primitive Signal** : une valeur réactive observable par Angular. Elle contient une valeur, se lit avec `()`, et Angular mémorise automatiquement les templates, `computed()` et `effect()` qui l'ont lue.

```ts
readonly placeholder = signal('Rechercher un client'); // déclarer un signal string
placeholder()                                          // lire
this.placeholder.set('Rechercher par email');          // écrire
this.placeholder.update(v => v + '...');               // mettre à jour depuis la valeur courante
```

NB : ne jamais écraser la référence d'un signal. `readonly` protège la référence, pas la valeur : `.set()` et `.update()` restent autorisés.

### Objectif et consigne

Dans `src/app/features/clients/pages/clients/clients.component.ts`, convertir la propriété `adding = false` en signal pour faire de `adding` une source réactive lisible par le template.

<details>
<summary>Correctif proposé</summary>

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

</details>

### Test

```bash
npm test -- --runTestsByPath src/app/features/clients/pages/clients/clients.component.spec.ts
```

---

## Exercice 2 — `computed()`

<details>
<summary>Cas d’erreur illustré</summary>

Une valeur dérivée placée dans un getter, une méthode ou le template peut être recalculée à chaque lecture et se retrouver dupliquée.

Reproduit dans `computed-lab-card.component.ts` :

```ts
private computeBlockedCount(): number {
  this.functionCallCount += 1;
  return this.accounts().filter(a => a.status === 'blocked').length;
  // filtre la liste entière à chaque appel — 5 lectures = 5 calculs
}
```

</details>

### API Signal à utiliser

> `computed()` est une **primitive Signal** : une valeur dérivée mémorisée. Le calcul ne se relance que si une dépendance lue a changé depuis la dernière lecture.

```ts
readonly blockedAccountsCount = computed(() =>
  this.filteredAccounts().filter(a => a.status === 'blocked').length
);

blockedAccountsCount()  // lecture
```
### Objectif et consigne

Dans `accounts.facade.ts`, `accounts.component.ts` et `accounts.component.html`, transformer `blockedAccountsCount` en valeur dérivée mémorisée avec `computed()`, puis exposer le signal dans le composant.

<details>
<summary>Correctif proposé</summary>

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

</details>

### Test

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

---

## Exercice 3 — `effect()` + `untracked()` pour synchroniser un état

<details>
<summary>Cas d’erreur illustré</summary>

Une règle de synchronisation appelée à la main devient fragile : dès qu'une mutation oublie l'appel, l'état peut devenir incohérent.

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

</details>

### APIs Signal à utiliser

> `effect()` est une **primitive Signal** : elle exécute un effet de bord quand les signals lus dans son corps changent. Elle s'exécute automatiquement, sans appel explicite.
> `untracked()` permet de lire un signal dans un `effect()` sans l'ajouter aux dépendances suivies.

### Objectif et consigne

Dans `src/app/features/clients/pages/clients/clients.component.ts`, remplacer l'appel impératif `this.clampCurrentPage()` par un `effect()` afin de rendre la synchronisation automatique. Utiliser `untracked()` pour lire la page courante sans en faire une dépendance directe de l'effet.

<details>
<summary>Correctif proposé</summary>

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

</details>

### Test

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

---

## Exercice 4 — `input()`

<details>
<summary>Cas d’erreur illustré</summary>

Une entrée `@Input()` classique lue dans un `computed()` ne devient pas une dépendance signal. La valeur dérivée peut donc rester bloquée sur sa première lecture.

Reproduit dans `input-lab-card.component.ts` (`LabInputChildComponent`) :

```ts
@Input() classicShowDetails = true;

readonly classicLabel = computed(() =>
  this.classicShowDetails ? 'details visibles' : 'details masques'
);
```

Le parent bascule `classicShowDetails`, mais `classicLabel()` retourne toujours la valeur calculée lors de la première exécution.

</details>

### API Angular à utiliser

> `input()` est une **API Angular** : elle déclare une entrée de composant sous forme de signal. La valeur passée par le parent devient une dépendance réelle dans les `computed()` et `effect()`.

```ts
showStatus = input(true);              // avec valeur par défaut
account = input.required<Account>();   // requis
showStatus()                           // lecture
```
### Objectif et consigne

Dans `src/app/features/accounts/components/account-card/account-card.component.ts`, transformer `@Input() showStatus = true` en `showStatus = input(true)` pour faire de cette entrée une vraie dépendance signal dans `visibleStatusLabel`. Retirer aussi `Input` des imports.

<details>
<summary>Correctif proposé</summary>

```ts
// Avant
@Input() showStatus = true;
readonly visibleStatusLabel = computed(() => this.showStatus ? this.statusLabel() : null);

// Après
showStatus = input(true);
readonly visibleStatusLabel = computed(() => this.showStatus() ? this.statusLabel() : null);
```

> Point clé : `@Input()` dans un `computed()` ne crée **pas** de dépendance réelle. `input()` dans un `computed()` **est** une dépendance réelle.

</details>

### Test

```bash
npm test -- --runTestsByPath src/app/features/accounts/components/account-card/account-card.component.spec.ts
```

### Parenthèse APIs composant — `output()` et `model()`

`output()` remplace `@Output()` + `EventEmitter` pour déclarer une intention envoyée au parent.

```ts
@Output() selectedRequested = new EventEmitter<Account>();

// devient

selectedRequested = output<Account>();       // déclarer
this.selectedRequested.emit(account);        // émettre
(selectedRequested)="startEdit($event)"      // écouter dans le parent
```

`output()` n'est pas un Observable : il sert à signaler un événement de composant.

`model()` sert quand le parent et l'enfant partagent une valeur modifiable des deux côtés. Il remplace le couple `@Input()` + `@Output()` utilisé pour le two-way binding.

```ts
// Enfant
quantity = model(1);
this.quantity.update(q => q + 1);

// Parent
<app-counter [(quantity)]="quantity" />
```

À retenir : `output()` émet une intention ; `model()` partage une valeur éditable.

---

## Exercice 5 — `linkedSignal()`

<details>
<summary>Cas d’erreur illustré</summary>

Pour un formulaire prérempli depuis une sélection, `computed()` est trop rigide car il est en lecture seule. Un `signal()` simple peut aussi se désynchroniser si on oublie de le réinitialiser.

Reproduit dans `linked-signal-lab-card.component.ts` :

```ts
readonly selected = signal<DemoPerson>(PERSONS[0]);

// computed() — se synchronise automatiquement, mais lecture seule
readonly computedName = computed(() => this.selected().name);
// → l'utilisateur ne peut pas modifier cette valeur dans un champ input
// computedName.set('Alice modifiée'); // ← ERREUR : computed() est en lecture seule
```

</details>

### API Signal à utiliser

> `linkedSignal()` est une **primitive Signal** : elle crée un signal writable dérivé d'un autre signal. Contrairement à `computed()` qui est en lecture seule, sa valeur peut être modifiée par `.set()` ou `.update()`. Elle est automatiquement recalculée quand la source change.

```ts
readonly value = linkedSignal(() => this.source());
value()        // lecture
value.set(x)   // écriture possible — contrairement à computed()
// Quand source() change → value() est recalculée depuis la source
```
### Objectif et consigne

Dans `src/app/features/accounts/pages/accounts/accounts.component.ts`, convertir `editAccount` en `linkedSignal()` pour créer une valeur dérivée depuis le compte sélectionné, mais modifiable localement par l'utilisateur. Ajouter un signal `accountForEdit` pour porter la sélection courante.

<details>
<summary>Correctif proposé</summary>

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

</details>

### Test

```bash
npm test -- --runTestsByPath src/app/features/accounts/pages/accounts/accounts.component.spec.ts
```

### `linkedSignal()` vs `computed()`

| `computed()` | `linkedSignal()` |
|---|---|
| Lecture seule | Writable — `.set()` et `.update()` disponibles |
| Recalculé quand les dépendances changent | Recalculé quand la source change, modifiable entre deux |
| Adapté aux valeurs dérivées stables | Adapté aux formulaires pré-remplis depuis une sélection |

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
| `model()` | Valeur partagée modifiable des deux côtés | `@Input()` + `@Output()` pour le two-way binding |

---

## Clôture du dojo — Règles à retenir

Les conventions d'usage des APIs Signals utilisées ici et la décision de ne pas migrer vers
le mode zoneless sont détaillées dans `docs/adr/0002-conventions-usage-signals-et-detection-changement.md`.

```
1. computed()    ne fait jamais d'appel HTTP — calcul pur uniquement
2. effect()      n'expose jamais de valeur    — effets de bord uniquement
3. input() dans un computed() = dépendance réelle / @Input() dans computed() = non
4. Zone.js peut coexister — migrer progressivement, pas tout d'un coup
5. untracked()   pour lire sans s'abonner dans un effect()
```

