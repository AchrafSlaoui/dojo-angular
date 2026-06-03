# ADR 0001 - Architecture pédagogique du dojo Angular Signals

## Contexte

Le dojo enseigne Angular Signals dans une application Angular 21 existante. L'objectif n'est pas de montrer une application totalement migrée, mais une migration progressive et réaliste depuis un projet Angular avec `zone.js`, `OnPush`, RxJS et des composants standalone.

Le support de présentation doit rester centré sur les exercices. Les intentions d'architecture du projet sont documentées ici pour éviter d'alourdir les slides.

## Décisions

### Garder `zone.js` et `OnPush` pendant le dojo

Le projet conserve `zone.js` et `OnPush` pour montrer que Signals peut être introduit progressivement. Le dojo ne force pas un passage immédiat en mode zoneless.

`zone.js` continue de déclencher la détection de changement après les événements asynchrones. Signals rend l'état et ses dépendances plus explicites.

### Montrer deux patterns Signals

Le projet montre volontairement deux styles :

- Signals directement dans les composants pour les bases : `signal()`, `computed()`, `effect()`.
- Signals dans des façades pour l'état partagé et les règles métier dérivées.

Cette asymétrie est intentionnelle. Elle sert de progression pédagogique : d'abord un composant simple, puis une extraction vers une façade quand l'état devient partagé ou plus riche.

### Accepter un code mixte pendant la migration

Le projet contient à la fois :

- des signals ;
- des propriétés classiques ;
- des façades ;
- des flux RxJS.

Ce mélange est volontaire. Tous les états locaux transitoires ne doivent pas être convertis mécaniquement en signals. Une propriété classique reste acceptable si elle est locale, simple, manipulée par des handlers de template et sans besoin d'être lue par un `computed()` ou un `effect()`.

Certains fichiers montrent donc volontairement des états déjà migrés et des états classiques dans le même projet :

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

Dans ce dojo, on ne convertit donc pas tout mécaniquement. L'exercice 1 convertit `adding` dans `ClientsComponent` pour apprendre `signal()`, tandis que le `adding` de `AccountsComponent` reste volontairement classique pour illustrer une migration progressive.

### Scoper les façades stateful au composant

Le projet contient deux types de façades qui n'ont pas le même rôle :

**Façades stateful** (`AccountsFacade`, `MovementsFacade`) : déclarées dans `providers` du composant consommateur, pas dans `root`. Chaque page obtient sa propre instance. L'état ne fuit pas entre navigations et le cycle de vie est lié au composant.

```ts
@Component({ providers: [AccountsFacade] })
```

**Façade d'orchestration** (`ClientAccountsFacade`) : `providedIn: 'root'`, sans état, orchestre uniquement des appels parallèles et retourne le résultat. Stateless, donc sans risque à être globale.

Règle : une façade qui porte de l'état doit être scopée au composant. Une façade sans état peut être globale.

### Garder RxJS pour les flux temporels

RxJS reste l'outil adapté pour les flux dans le temps : debounce, combinaison de flux, WebSocket, polling, orchestration d'Observables.

`toSignal()` est un pont vers le monde Signals. Il expose la dernière valeur d'un Observable sous forme de signal. Il ne remplace pas RxJS.

### Organiser les branches d'exercices de manière cumulative

Les branches d'exercices sont cumulatives :

```text
init
└── exercice-1
    └── exercice-2
        └── exercice-3
            └── exercice-4
                └── exercice-5
                    └── exercice-6
                        └── exercice-7
                            └── exercice-8
```

Chaque branche ajoute uniquement la correction de son exercice par rapport à la branche précédente.
