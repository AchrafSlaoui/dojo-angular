# Angular 21 Signals — Dojo court

---

## Rappels — Signal

Un signal est une valeur reactive lue avec `()`. Quand sa valeur change, Angular sait quelles lectures dependent de cette valeur.

- Representer explicitement un etat reactive dans l'application.
- Notifier Angular des lectures dependantes quand la valeur change.
- Un signal se lit avec `()` et se modifie avec `.set()` ou `.update()`.
- `computed()` derive une valeur ; `effect()` declenche un effet de bord.

---

## Rappels — Zone.js

Zone.js intercepte les evenements asynchrones du navigateur et previent Angular qu'un cycle de detection peut etre lance.

- Declencher la detection de changement apres une tache asynchrone.
- Fournir le comportement historique d'Angular sans appels manuels de detection.
- Zone.js ne modelise pas l'etat applicatif et ne sait pas quelle valeur a change.
- Les Signals completent ce mecanisme en rendant les dependances d'etat explicites.

---

## Rappels — RxJS

RxJS sert a modeliser des flux dans le temps : HTTP, route params, evenements, `debounceTime`, `switchMap`, `combineLatest`.

- Modeliser et composer des donnees qui arrivent dans le temps.
- Gerer les transformations asynchrones avec des operateurs comme `switchMap` ou `debounceTime`.
- `toSignal()` expose la derniere valeur d'un Observable comme signal.
- `toObservable()` permet de repasser d'un signal vers un flux Observable.

---

## Structure des branches

Les branches d'exercices sont cumulatives.

```text
init
`-- exercice-1
    `-- exercice-2
        `-- exercice-3
            `-- exercice-4
                `-- exercice-5
                    `-- exercice-6
                        `-- exercice-7
                            `-- exercice-8
```

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

---

## Rappel tests

- Avant de commencer un exercice, lancer les tests pour connaitre l'etat de depart.
- A la fin de l'exercice, relancer les tests pour verifier la migration.
- Si une erreur apparait, identifier si elle vient du changement realise.
- Si besoin, corriger le code ou le test pour refleter le comportement attendu.

```bash
npm test
```
