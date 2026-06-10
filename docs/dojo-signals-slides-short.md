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

| Ex. | API | Definition courte | Consigne |
|---|---|---|---|
| 1 | `signal()` | Valeur reactive mutable lue avec `()`. | L'etat d'ajout de la page clients doit devenir un signal. |
| 2 | `computed()` | Valeur derivee en lecture seule. | Les valeurs derivees de la facade accounts doivent etre exposees en `computed()`. |
| 3 | `effect()` | Effet de bord declenche par les signals lus. | La coherence de l'etat UI clients doit etre synchronisee par un `effect()`. |
| 4 | `viewChild()` + `effect()` | Reference DOM exposee comme signal, puis effet DOM. | Le focus du champ prenom doit etre gere avec `viewChild()` signal et `effect()`. |
| 5 | `input()` | Entree de composant exposee comme signal. | L'entree du composant carte compte doit etre convertie en `input()`. |
| 6 | `output()` | Evenement emis par l'enfant vers le parent. | L'intention de selection doit etre emise avec `output()`. |
| 7 | `toSignal()` / `toObservable()` | Frontiere entre Observable RxJS et signal Angular. | Les flux route, chargement et recherche doivent etre connectes aux signals. |
| 8 | `computed()` facade | Vue derivee de l'etat metier dans une facade. | La logique active filter doit etre exposee par un `computed()` de facade. |
