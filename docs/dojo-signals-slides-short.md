# Angular 21 Signals — Dojo court

---

## Rappels — Signal

Un signal est une valeur reactive lue avec `()`. Quand sa valeur change, Angular sait quelles lectures dependent de cette valeur.

- `signal()` cree une valeur mutable.
- `computed()` cree une valeur derivee.
- `effect()` observe des signals pour declencher un effet de bord.
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

- RxJS reste adapte aux flux asynchrones.
- `toSignal()` expose la derniere valeur d'un Observable comme signal.
- `toObservable()` expose un signal comme Observable.
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

## Exercices

| Ex. | Fichier(s) | Definition courte | Consigne claire |
|---|---|---|---|
| 1 — `signal()` | `clients/pages/clients/clients.component.ts` | Valeur reactive mutable lue avec `()`. | Remplacer l'etat d'ouverture du formulaire d'ajout par un signal. Le template et les tests doivent lire cet etat avec la syntaxe signal. |
| 2 — `computed()` | `accounts.facade.ts`, `accounts.component.*` | Valeur derivee en lecture seule. | Deplacer les calculs d'affichage de la page accounts dans des `computed()` de facade. Le composant doit consommer ces valeurs deja derivees. |
| 3 — `effect()` | `clients/pages/clients/clients.component.ts` | Effet de bord declenche par les signals lus. | Ajouter une reaction automatique qui garde l'etat UI coherent quand les donnees clients ou les filtres changent. |
| 4 — `viewChild()` + `effect()` | `clients/pages/clients/clients.component.ts` | Reference DOM exposee comme signal, puis effet DOM. | Convertir la reference du champ prenom en `viewChild()` signal, puis creer l'`effect()` qui place le focus quand le champ existe. |
| 5 — `input()` | `account-card/account-card.component.ts` | Entree de composant exposee comme signal. | Convertir l'entree `showStatus` en `input()`. Le calcul du statut visible doit reagir quand le parent change cette entree. |
| 6 — `output()` | `account-list/account-list.component.ts` | Evenement emis par l'enfant vers le parent. | Remplacer la sortie legacy de selection par `output()`. La liste emet l'intention, le parent garde la decision et l'action. |
| 7 — `toSignal()` / `toObservable()` | `accounts.component.ts`, `dashboard.component.ts`, `clients.component.ts` | Pont entre Observable RxJS et signal Angular. | Connecter les flux route, chargement et recherche aux signals. RxJS reste responsable de composer les flux asynchrones. |
| 8 — `computed()` facade | `accounts.facade.ts`, `accounts.component.*` | Vue derivee de l'etat metier dans une facade. | Exposer `hasActiveFilter` depuis la facade avec `computed()`. Le composant ne doit plus porter ce calcul metier. |
