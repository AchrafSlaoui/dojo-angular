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

| Ex. | Definition courte | Consigne claire |
|---|---|---|
| 1 — `signal()` | Valeur reactive mutable lue avec `()`. | Dans la page clients, l'ouverture du formulaire d'ajout ne doit plus etre un booleen classique : elle doit etre portee par un signal et rester lisible depuis le template et les tests. |
| 2 — `computed()` | Valeur derivee en lecture seule. | Dans la facade accounts, les calculs derives doivent devenir des `computed()` afin que le composant consomme directement des valeurs reactives pretes a afficher. |
| 3 — `effect()` | Effet de bord declenche par les signals lus. | Dans la page clients, l'etat UI doit rester coherent automatiquement quand les donnees ou les filtres changent, sans dupliquer cette logique dans le template. |
| 4 — `viewChild()` + `effect()` | Reference DOM exposee comme signal, puis effet DOM. | Dans la page clients, le champ prenom doit recevoir le focus quand il devient disponible dans le DOM, avec une reference `viewChild()` signal et un `effect()` cree par les participants. |
| 5 — `input()` | Entree de composant exposee comme signal. | Dans la carte compte, l'entree `showStatus` doit devenir une entree signal pour etre une vraie dependance reactive du calcul d'affichage. |
| 6 — `output()` | Evenement emis par l'enfant vers le parent. | Dans la liste des comptes, la selection d'un compte doit etre emise avec `output()` comme une intention vers le parent, en gardant le parent responsable de l'action. |
| 7 — `toSignal()` / `toObservable()` | Frontiere entre Observable RxJS et signal Angular. | Les flux de route, de chargement et de recherche doivent etre connectes aux signals sans supprimer RxJS la ou il compose le flux asynchrone. |
| 8 — `computed()` facade | Vue derivee de l'etat metier dans une facade. | La facade accounts doit exposer l'etat derive `hasActiveFilter` pour retirer ce calcul du composant et centraliser la regle metier. |
