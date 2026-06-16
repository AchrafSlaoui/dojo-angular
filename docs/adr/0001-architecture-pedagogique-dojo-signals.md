# ADR 0001 - Architecture Angular Signals progressive

## Contexte

L'application est une base Angular 21 existante avec `zone.js`, `OnPush`, RxJS et des composants standalone.

L'objectif est d'introduire Angular Signals sans imposer une réécriture complète. Le parcours principal du dojo couvre `signal()`, `computed()`, `effect()`, `input()` et `linkedSignal()`. `output()` et `model()` sont présentés comme parenthèse sur les APIs composant.

Les décisions ci-dessous cadrent la migration progressive, la place des façades et la frontière entre Signals, RxJS et la détection de changement Angular.

## Décisions

### Garder `zone.js` et `OnPush`

Le projet conserve `zone.js` et `OnPush`.

`zone.js` continue de déclencher la détection de changement après les événements asynchrones. `OnPush` limite les vérifications inutiles. Signals rend l'état et ses dépendances plus explicites sans obliger à supprimer immédiatement le fonctionnement historique d'Angular.

Cette combinaison permet une migration progressive : les composants peuvent adopter Signals là où cela apporte de la lisibilité ou une meilleure granularité, tout en gardant le code existant fonctionnel.

### Utiliser deux patterns Signals

Le projet utilise deux styles complémentaires :

- Signals directement dans les composants pour l'état local : `signal()`, `computed()`, `effect()`, `linkedSignal()`.
- Signals dans des façades pour l'état partagé et les règles métier dérivées.

L'état local simple peut rester au niveau du composant. Quand l'état devient partagé, riche, ou porteur de règles métier, il doit être déplacé dans une façade.

### Consolider les règles métier dérivées dans les façades

Les règles métier dérivées doivent être nommées et exposées depuis la façade quand elles dépendent de l'état partagé ou quand elles peuvent être réutilisées.

Cela évite les calculs inline dans les templates ou les composants, rend l'intention plus lisible et permet de tester directement la règle.

### Accepter un code mixte pendant la migration

Le projet contient volontairement :

- des signals ;
- des propriétés classiques ;
- des façades ;
- des flux RxJS.

Tous les états locaux transitoires ne doivent pas être convertis mécaniquement en signals. Une propriété classique reste acceptable si elle est locale, simple, manipulée par des handlers de template et sans besoin d'être lue par un `computed()` ou un `effect()`.

Certains fichiers montrent donc des états déjà migrés et des états classiques dans la même application :

```ts
// ClientCardComponent
editMode = false;
editModel: ClientUpdate | null = null;

// ClientDetailComponent
addingAccount = false;
readonly mutating = this.accountsFacade.mutating;

// AccountsComponent
adding = false;
```

Dans les templates, cela donne aussi un mélange visible :

```html
@if (addingAccount) { ... }
@if (mutating()) { ... }
```

Ce n'est pas une incohérence. C'est le reflet d'une migration progressive :

- `mutating()` vient d'une façade Signals et peut être partagé entre composants ;
- `addingAccount`, `adding`, `editMode` et `editModel` sont des états locaux transitoires ;
- avec `zone.js` + `OnPush`, un clic template marque le composant à vérifier ;
- convertir en signal devient intéressant quand l'état est lu par `computed()`, `effect()`, plusieurs composants, ou quand on veut expliciter ses dépendances.

### Scoper les façades stateful au composant

Le projet contient deux types de façades qui n'ont pas le même rôle.

**Façades stateful** (`AccountsFacade`, `MovementsFacade`) : déclarées dans `providers` du composant consommateur, pas dans `root`. Chaque page obtient sa propre instance. L'état ne fuit pas entre navigations et le cycle de vie est lié au composant.

```ts
@Component({ providers: [AccountsFacade] })
```

**Façade d'orchestration** (`ClientAccountsFacade`) : `providedIn: 'root'`, sans état, orchestre uniquement des appels parallèles et retourne le résultat. Stateless, donc sans risque à être globale.

Règle : une façade qui porte de l'état doit être scopée au composant. Une façade sans état peut être globale.

### Garder RxJS pour les flux temporels

RxJS reste l'outil adapté pour les flux dans le temps : debounce, combinaison de flux, WebSocket, polling, orchestration d'Observables.

`toSignal()` est un pont vers le monde Signals. Il expose la dernière valeur d'un Observable sous forme de signal, mais il ne remplace pas RxJS.

Cette interopérabilité reste hors exercices principaux du support `dojo-signals-core.md`, qui se concentre sur les primitives Signals et les APIs composant essentielles.
