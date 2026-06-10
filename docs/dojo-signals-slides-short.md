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

| Ex. | Fichier(s) | Definition courte | Besoin a couvrir |
|---|---|---|---|
| 1 — `signal()` | `src/app/features/clients/pages/clients/clients.component.ts` | Valeur reactive mutable lue avec `()`. | Convertir l'etat `adding` en signal. Le template doit afficher le formulaire a partir de ce nouvel etat reactif. |
| 2 — `computed()` | `src/app/features/accounts/services/accounts.facade.ts`, `src/app/features/accounts/pages/accounts/accounts.component.*` | Valeur derivee en lecture seule. | Transformer `blockedAccountsCount` en valeur derivee de la facade. La page accounts doit afficher ce compteur sans recalculer elle-meme la regle. |
| 3 — `effect()` | `src/app/features/clients/pages/clients/clients.component.ts` | Effet de bord declenche par les signals lus. | Remplacer le recalage imperatif de la page courante par une reaction automatique. Quand la liste change, la page selectionnee doit rester valide. |
| 4 — `viewChild()` + `effect()` | `src/app/features/clients/pages/clients/clients.component.ts` | Reference DOM exposee comme signal, puis effet DOM. | Remplacer la reference DOM classique du champ prenom par une reference signal, puis declencher le focus quand ce champ apparait. |
| 5 — `input()` | `src/app/features/accounts/components/account-card/account-card.component.ts` | Entree de composant exposee comme signal. | Convertir `showStatus` en input signal. Le libelle de statut doit reagir correctement quand le parent choisit d'afficher ou masquer ce statut. |
| 6 — `output()` | `src/app/features/accounts/components/account-list/account-list.component.ts` | Evenement emis par l'enfant vers le parent. | Remplacer la sortie legacy `selectedRequested` par `output()`. La liste doit continuer a emettre la selection vers le parent. |
| 7 — `toSignal()` / `toObservable()` | `src/app/features/accounts/pages/accounts/accounts.component.ts`, `src/app/features/clients/pages/dashboard/dashboard.component.ts`, `src/app/features/clients/pages/clients/clients.component.ts` | Pont entre Observable RxJS et signal Angular. | Remplacer la souscription manuelle a la route par `toSignal()`, exposer le chargement dashboard comme signal, et identifier le pont inverse `toObservable()` pour la recherche debouncee. |
| 8 — `computed()` facade | `src/app/features/accounts/services/accounts.facade.ts`, `src/app/features/accounts/pages/accounts/accounts.component.*` | Vue derivee de l'etat metier dans une facade. | Ajouter `hasActiveFilter` comme valeur derivee de la facade. Le message vide doit dependre de cette regle exposee par la facade. |

Rappel tests : les tests ne sont pas l'objectif principal du dojo. S'ils echouent a cause de la migration demandee, corriger les erreurs pour refleter le nouveau comportement.
