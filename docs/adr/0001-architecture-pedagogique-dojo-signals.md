# ADR 0001 - Architecture pedagogique du dojo Angular Signals

## Statut

Accepte.

## Contexte

Le dojo enseigne Angular Signals dans une application Angular 21 existante.
L'objectif n'est pas de montrer une application totalement migree, mais une
migration progressive et realiste depuis un projet Angular avec `zone.js`,
`OnPush`, RxJS et des composants standalone.

Le support de presentation doit rester centre sur les exercices. Les intentions
d'architecture du projet sont documentees ici pour eviter d'alourdir les slides.

## Decisions

### Garder `zone.js` et `OnPush` pendant le dojo

Le projet conserve `zone.js` et `OnPush` pour montrer que Signals peut etre
introduit progressivement. Le dojo ne force pas un passage immediat en mode
zoneless.

`zone.js` continue de declencher la detection de changement apres les evenements
asynchrones. Signals rend l'etat et ses dependances plus explicites.

### Montrer deux patterns Signals

Le projet montre volontairement deux styles :

- Signals directement dans les composants pour les bases : `signal()`,
  `computed()`, `effect()`.
- Signals dans des facades pour l'etat partage et les regles metier derivees.

Cette asymetrie est intentionnelle. Elle sert de progression pedagogique :
d'abord un composant simple, puis une extraction vers une facade quand l'etat
devient partage ou plus riche.

### Accepter un code mixte pendant la migration

Le projet contient a la fois :

- des signals ;
- des proprietes classiques ;
- des facades ;
- des flux RxJS.

Ce melange est volontaire. Tous les etats locaux transitoires ne doivent pas etre
convertis mecaniquement en signals. Une propriete classique reste acceptable si
elle est locale, simple, manipulee par des handlers de template et sans besoin
d'etre lue par un `computed()` ou un `effect()`.

### Scoper les facades stateful au composant

Le projet contient deux types de facades qui n'ont pas le meme role :

**Facades stateful** (`AccountsFacade`, `MovementsFacade`) : declarees dans
`providers` du composant consommateur, pas dans `root`. Chaque page obtient sa
propre instance. L'etat ne fuit pas entre navigations et le cycle de vie est lie
au composant.

```ts
@Component({ providers: [AccountsFacade] })
```

**Facade d'orchestration** (`ClientAccountsFacade`) : `providedIn: 'root'`,
sans etat, orchestre uniquement des appels paralleles et retourne le resultat.
Stateless, donc sans risque a etre globale.

Regle : une facade qui porte de l'etat doit etre scopee au composant. Une
facade sans etat peut etre globale.

### Garder RxJS pour les flux temporels

RxJS reste l'outil adapte pour les flux dans le temps : debounce, combinaison de
flux, WebSocket, polling, orchestration d'Observables.

`toSignal()` est un pont vers le monde Signals. Il expose la derniere valeur d'un
Observable sous forme de signal. Il ne remplace pas RxJS.

### Organiser les branches d'exercices de maniere cumulative

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

Chaque branche ajoute uniquement la correction de son exercice par rapport a la
branche precedente.

## Consequences

- Les participants voient une migration progressive, pas une reecriture totale.
- Les proprietes classiques et les signals peuvent coexister dans le meme projet.
- Les facades restent pertinentes pour l'etat partage.
- RxJS garde son role sur les flux temporels.
- Le mode zoneless reste un sujet avance et separe des exercices principaux.
- Le support principal peut rester concentre sur les definitions, consignes et
  exemples, pendant que cet ADR porte les decisions d'architecture.
