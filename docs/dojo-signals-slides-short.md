# Angular 21 Signals — Dojo court

---

## Rappels — Signal

Un signal est une valeur reactive lue avec `()`. Quand sa valeur change, Angular sait quelles lectures dependent de cette valeur : template, `computed()` ou `effect()`.

- `signal()` cree une valeur mutable.
- `.set()` remplace la valeur.
- `.update()` calcule la nouvelle valeur depuis l'ancienne.
- Le template lit un signal avec `monSignal()`.

---

## Rappels — Zone.js

Zone.js intercepte les evenements asynchrones du navigateur et previent Angular qu'un cycle de detection peut etre lance.

- Zone.js declenche la detection apres un evenement async.
- Zone.js ne dit pas quel etat applicatif a change.
- Le dojo garde Zone.js pour montrer une migration progressive.
- Les Signals rendent les dependances d'etat plus explicites.

---

## Rappels — RxJS

RxJS sert a modeliser des flux dans le temps : HTTP, route params, evenements, `debounceTime`, `switchMap`, `combineLatest`.

- RxJS reste adapte aux flux asynchrones et aux operateurs temporels.
- `toSignal()` expose la derniere valeur d'un Observable comme signal.
- `toObservable()` permet de brancher un signal dans un pipe RxJS.
- Le but est de placer clairement la frontiere entre flux RxJS et etat signal.

---

## Structure des branches

| Branche | Role |
|---|---|
| `main` / `init` | base sans correction |
| `exercice-1` | correction exercice 1 |
| `exercice-2` | corrections exercices 1 + 2 |
| `exercice-N` | corrections cumulees jusqu'a N |

Chaque branche d'exercice ajoute uniquement la correction de son exercice par rapport a la branche precedente.

---

## Exercices — Vue d'ensemble

| Exercice | Signal / API | Fichiers principaux |
|---|---|---|
| 1 | `signal()` | `clients.component.ts`, `clients.component.html`, spec |
| 2 | `computed()` | facade accounts + page accounts |
| 3 | `effect()` | `clients.component.ts` |
| 4 | `viewChild()` + `effect()` | `clients.component.ts` |
| 5 | `input()` | `account-card.component.ts` |
| 6 | `output()` | `account-list.component.ts` |
| 7 | `toSignal()` / `toObservable()` | accounts, dashboard, clients |
| 8 | `computed()` facade | facade accounts + page accounts |

---

## Exercice 1 — `signal()`

### Definition et consignes

`signal()` cree une valeur reactive mutable. Elle se lit avec `()` et se modifie avec `.set()` ou `.update()`.

- Convertir `adding = false` en signal.
- Remplacer les lectures par `adding()`.
- Remplacer les ecritures directes par `.set(...)`.
- Adapter les tests qui lisent ou modifient `adding`.

---

## Exercice 2 — `computed()`

### Definition et consignes

`computed()` cree une valeur derivee en lecture seule. Elle est recalculee quand les signals lus dans son corps changent.

- Remplacer les getters derives de la facade accounts par des `computed()`.
- Lire les valeurs derivees avec `()`.
- Adapter le composant et le template accounts.
- Adapter les tests.

---

## Exercice 3 — `effect()`

### Definition et consignes

`effect()` execute un effet de bord quand un signal lu dans son corps change. Il sert a synchroniser une action, pas a calculer une valeur.

- Ajouter un `effect()` dans `clients.component.ts`.
- Observer les signals necessaires a la coherence d'etat.
- Corriger automatiquement l'etat UI devenu invalide.
- Ne pas remplacer un `computed()` par un `effect()`.

---

## Exercice 4 — `viewChild()` + `effect()`

### Definition et consignes

`viewChild()` expose une reference DOM comme signal. Il vaut `undefined` tant que l'element n'est pas present, puis retourne la reference quand elle existe.

- Transformer le `@ViewChild` classique en `viewChild()` signal.
- Creer l'`effect()` depuis zero.
- Declencher le focus quand l'element cible est disponible.
- Garder la logique DOM dans le composant.

---

## Exercice 5 — `input()`

### Definition et consignes

`input()` declare une entree de composant sous forme de signal. Le composant enfant lit l'entree avec `()`.

- Convertir l'input classique de `AccountCardComponent`.
- Utiliser `input.required()` si la valeur est obligatoire.
- Remplacer les lectures par la syntaxe signal.
- Verifier que le parent garde la meme responsabilite.

---

## Exercice 6 — `output()`

### Definition et consignes

`output()` declare un evenement emis par un composant enfant vers son parent. Il sert a transmettre une intention, pas a partager un etat global.

- Remplacer l'ancien `EventEmitter` par `output()`.
- Emettre l'intention depuis l'enfant.
- Laisser le parent executer l'action.
- Garder `model()` pour les vrais cas bidirectionnels.

---

## Exercice 7 — `toSignal()` / `toObservable()`

### Definition et consignes

`toSignal()` convertit un Observable en signal. `toObservable()` expose un signal comme Observable pour le composer avec RxJS.

- Remplacer la souscription manuelle a `paramMap` par `toSignal()`.
- Remplacer le chargement manuel par un signal issu d'un flux RxJS.
- Utiliser `toObservable()` uniquement quand un signal doit entrer dans un pipe RxJS.
- Garder RxJS pour la composition temporelle.

---

## Exercice 8 — `computed()` facade

### Definition et consignes

Dans une facade, `computed()` permet d'exposer une vue derivee stable de l'etat metier sans dupliquer la logique dans les composants.

- Ajouter le `computed()` demande dans la facade accounts.
- Remplacer la logique du composant par la lecture du signal derive.
- Adapter le template si necessaire.
- Garder les regles metier dans la facade.

---

## Fin

Le Markdown detaille reste disponible dans `docs/dojo-signals-slides.md`.

Le PPTX court sert a guider l'animation : rappels, branches, consignes, puis passage au code.
