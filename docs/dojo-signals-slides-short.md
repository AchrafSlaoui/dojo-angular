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

## Rappels — Modes de détection

| Déclencheur | Zone.js (défaut) | Zone.js + OnPush | Zoneless |
|---|---|---|---|
| Evenement async | Tout l'arbre | Sous-arbre marked dirty | Aucun déclencheur automatique |
| `@Input()` change | ✓ | ✓ | Aucun effet — utiliser `input()` |
| `input()` / signal change | ✓ | ✓ | ✓ |
| `async` pipe | ✓ | ✓ | Composant + parents verifies (markForCheck) |

Signal en zoneless : seuls les lecteurs directs sont mis a jour. async pipe : composant + parents verifies via markForCheck(), DOM mis a jour seulement si quelque chose a change.

```
Zone.js (défaut)
  → ajouter OnPush sur chaque composant
    → migrer les états vers signal() / input()
      → provideZonelessChangeDetection() + retirer zone.js
```

---

## Structure des branches

Les branches d'exercices sont cumulatives.

```text
main : support de présentation et documentation

init -> ex1 -> ex2 -> ex3 -> ex4 -> ex5 -> ex6
     -> ex6-model -> ex7 -> ex8 -> ex9 -> ex10 -> ex11
```

Chaque branche d'exercice ajoute uniquement la correction de son exercice par rapport a la branche precedente.

---

## Primitives Signal — Vue d'ensemble

| Primitive | Role | Exemple fichier |
|---|---|---|
| `signal()` | Etat mutable local. Se lit avec `()` et se modifie avec `.set()` ou `.update()`. | `clients.component.ts` |
| `computed()` | Valeur derivee pure, mise en cache, recalculee quand ses signaux lus changent. | `accounts.facade.ts` |
| `effect()` | Effet de bord reactif. Sert a synchroniser DOM, titre, page courante, etc. | `clients.component.ts` |
| `effect(onCleanup)` | Variante d'effet qui libere une ressource avant reexecution ou destruction. | `signals-demo.component.ts` |
| `viewChild()` | Reference DOM ou composant enfant exposee comme signal nullable. | `clients.component.ts` |
| `viewChildren()` | Liste reactive de references rendues, mise a jour avec le template. | `signals-demo.component.ts` |
| `input()` | Entree de composant en lecture seule, utilisable dans `computed()`. | `account-card.component.ts` |
| `output()` | Evenement sortant vers le parent. Exprime une intention, pas un etat. | `account-list.component.ts` |
| `model()` | Valeur bidirectionnelle explicite : input + output pour selection, toggle, formulaire. | `account-list.component.ts` |
| `linkedSignal()` | Signal writable initialise depuis une source et modifiable localement. | `accounts.component.ts` |
| `toSignal()` | Consomme la derniere valeur d'un Observable sous forme de signal. | `accounts.component.ts` |
| `toObservable()` | Expose un signal en Observable pour utiliser les operateurs RxJS. | `clients.component.ts` |
| `rxResource()` | Ressource async basee Observable, avec `value`, `isLoading` et `error`. | `dashboard.component.ts` |
| `afterNextRender()` | Callback one-shot apres le prochain rendu DOM. Utile pour scroll ou focus post-action. | `clients.component.ts` |
| `afterRender()` | Callback recurrent apres chaque rendu Angular. Utile pour mesures DOM continues. | `signals-demo.component.ts` |
| `untracked()` | Lit un signal sans l'ajouter aux dependances d'un `effect()` ou `computed()`. | `clients.component.ts` |
| `signal.asReadonly()` | Expose un etat interne sans donner acces au setter public. | `accounts.facade.ts` |

---

## Exercices

| Ex. | Fichier(s) | Definition courte | Besoin a couvrir |
|---|---|---|---|
| 1 — `signal()` | `src/app/features/clients/pages/clients/clients.component.ts` | Valeur reactive mutable lue avec `()`. | Convertir l'etat `adding` en signal. Le template doit afficher le formulaire a partir de ce nouvel etat reactif. |
| 2 — `computed()` | `src/app/features/accounts/services/accounts.facade.ts`, `src/app/features/accounts/pages/accounts/accounts.component.*` | Valeur derivee en lecture seule. | Transformer `blockedAccountsCount` en valeur derivee de la facade. La page accounts doit afficher ce compteur sans recalculer elle-meme la regle. |
| 3 — `effect()` + `untracked()` | `src/app/features/clients/pages/clients/clients.component.ts` | Effet de bord declenche par les signals lus, avec lecture non suivie. | Remplacer le recalage imperatif de la page courante par une reaction automatique. Lire la page courante avec `untracked()` pour ne pas l'ajouter aux dependances de l'effet. |
| 4 — `viewChild()` + `effect()` | `src/app/features/clients/pages/clients/clients.component.ts` | Reference DOM exposee comme signal, puis effet DOM. | Remplacer la reference DOM classique du champ prenom par une reference signal, puis declencher le focus quand ce champ apparait. |
| 5 — `input()` | `src/app/features/accounts/components/account-card/account-card.component.ts` | Entree de composant exposee comme signal. | Convertir `showStatus` en input signal. Le libelle de statut doit reagir correctement quand le parent choisit d'afficher ou masquer ce statut. |
| 6A — `output()` | `account-list.component.ts` | Evenement sortant vers le parent. Pas un Observable. | Groupe A : remplacer `selectedRequested` EventEmitter par `output()`. |
| 6B — `model()` | `account-list.component.ts`, `accounts.component.ts` | Valeur bidirectionnelle input+output. Two-way binding signal. | Groupe B : remplacer `editingAccountId input` + `editRequested` + `cancelRequested` par un seul `model()`. L'enfant controle l'etat d'edition directement. |
| 7 — `linkedSignal()` | `src/app/features/accounts/pages/accounts/accounts.component.ts` | Signal mutable qui se reinitialise quand sa source change. | Remplacer `editAccount` par un `linkedSignal()` derive du signal source. La valeur doit se remettre a zero quand le compte selectionne change. |
| 8 — `toSignal()` / `toObservable()` | `src/app/features/accounts/pages/accounts/accounts.component.ts`, `src/app/features/clients/pages/dashboard/dashboard.component.ts`, `src/app/features/clients/pages/clients/clients.component.ts` | Pont entre Observable RxJS et signal Angular. | Remplacer la souscription manuelle a la route par `toSignal()`, exposer le chargement dashboard comme signal, et identifier le pont inverse `toObservable()` pour la recherche debouncee. |
| 9 — `rxResource()` | `src/app/features/clients/pages/dashboard/dashboard.component.ts` | Chargement asynchrone reactif avec etat loading/error/value. | Remplacer le chargement imperatif du dashboard par `rxResource()`. Le composant doit exposer les signaux `loading`, `error` et `value` derives de la ressource. |
| 10 — `afterNextRender()` / `afterRender()` | `src/app/features/clients/pages/clients/clients.component.ts` | Hook post-rendu DOM one-shot ou recurrent. | Ajouter la reference au viewport, puis scroller en haut de liste avec `afterNextRender()` apres l'ajout d'un client. |
| 11 — `computed()` facade | `src/app/features/accounts/services/accounts.facade.ts`, `src/app/features/accounts/pages/accounts/accounts.component.*` | Vue derivee de l'etat metier dans une facade. | Ajouter `hasActiveFilter` comme valeur derivee de la facade. Le message vide doit dependre de cette regle exposee par la facade. |

---

## Extension avancée — Exercices 8 à 11

Ces exercices couvrent des primitives Angular avancées. Ils peuvent être traités en autonomie après les exercices socle (1 à 7).

---

## effect() — onCleanup

| Sans onCleanup | Avec onCleanup |
|---|---|
| Chaque re-exécution crée une ressource sans supprimer la précédente | La ressource est libérée avant la prochaine exécution |

```ts
effect((onCleanup) => {
  const id = setInterval(() => console.log(this.search()), 1000);
  onCleanup(() => clearInterval(id));
});
```

---

## afterNextRender() vs afterRender()

| | `afterNextRender()` | `afterRender()` |
|---|---|---|
| Frequence | Une seule fois apres le prochain rendu | Apres chaque cycle de rendu |
| Usage typique | Scroll one-shot, init librairie tierce | Mesures DOM continues, animations |
| Risque | Aucun surcout apres execution | Couteux si le rendu est frequent |

```ts
// one-shot : scroll apres un ajout
afterNextRender(() => viewport.scrollToIndex(0), { injector });

// recurrent : mesure la hauteur a chaque rendu
afterRender(() => { this.height.set(el.nativeElement.offsetHeight); });
```

En Zoneless, `afterRender()` ne se declenche que quand un signal change — beaucoup plus previsible qu'en Zone.js.

---

## Rappel tests

- Avant de commencer un exercice, lancer les tests pour connaitre l'etat de depart.
- A la fin de l'exercice, relancer les tests pour verifier la migration.
- Si une erreur apparait, identifier si elle vient du changement realise.
- Si besoin, corriger le code ou le test pour refleter le comportement attendu.

```bash
npm test
```
