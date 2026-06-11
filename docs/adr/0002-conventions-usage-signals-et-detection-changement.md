# ADR 0002 - Conventions Signals et stratégie de détection de changement

## Contexte

L'application utilise plusieurs APIs Angular liées aux Signals (`signal()`, `computed()`, `effect()`, `input()`, `output()`, `model()`, `toSignal()`), RxJS et la détection de changement Angular avec `zone.js` + `OnPush`.

Sans conventions explicites, ces APIs peuvent être utilisées de manière interchangeable alors qu'elles ne portent pas la même intention. Les décisions ci-dessous fixent les usages attendus et la stratégie de détection de changement.

## Décisions

### `computed()` est un calcul pur, jamais un effet de bord

`computed()` ne doit pas déclencher d'appel HTTP, écrire dans un signal, ou produire un effet observable. C'est une valeur dérivée mémorisée. Si un effet est nécessaire, `effect()` est l'outil adapté.

### `effect()` est un effet de bord, jamais une valeur exposée

`effect()` ne retourne rien d'utilisable. Il réagit à des changements pour produire un effet : focus, titre du document, log, correction d'un état cohérent.

Exposer une valeur via `effect()` indique que `computed()` était le bon choix.

### L'enfant émet une intention, le parent exécute l'action

`output()` sert à signaler une intention (`deleteRequested`, `saveRequested`). La décision d'agir appartient au parent.

Les enfants ne doivent pas dépendre directement de services applicatifs pour exécuter des actions métier qui appartiennent au parent ou à une façade.

### `model()` est réservé aux valeurs réellement bidirectionnelles

`model()` combine une entrée et une sortie. Il est adapté quand le parent et l'enfant partagent explicitement la propriété d'une valeur simple : sélection courante, filtre, toggle, état d'édition.

Il ne doit pas remplacer `output()` pour une commande métier. Une suppression, une sauvegarde ou une mutation applicative reste une intention émise par l'enfant et traitée par le parent.

### Ne pas bridger Signals et RxJS systématiquement

`toSignal()` et `toObservable()` sont des ponts ponctuels, pas une règle générale.

Ils sont justifiés quand un opérateur temporel (`debounceTime`, `distinctUntilChanged`) ou un Observable HTTP doit être consommé dans un contexte signal. Il faut rester dans un seul modèle réactif quand c'est possible.

### `toSignal()` gère le désabonnement

`toSignal()` souscrit et se désabonne automatiquement dans le contexte d'injection.

Ajouter `takeUntilDestroyed` en plus est redondant et source de confusion.

RxJS reste préférable pour les flux continus, le polling, les WebSockets, ou les compositions temporelles complexes. Les commandes de mutation (`POST`, `PUT`, `DELETE`) restent des actions explicites, souvent déclenchées dans une méthode.

### `input()` dans un `computed()` crée une dépendance réelle

Un `@Input()` classique lu dans un `computed()` ne crée pas de dépendance réactive : Angular ne recalculera pas la valeur dérivée quand l'entrée change.

`input()` dans un `computed()` est une dépendance réelle et sera réévalué si la valeur du parent change.

### `untracked()` sert uniquement aux lectures non dépendantes

Dans un `effect()` ou un `computed()`, lire un signal crée une dépendance.

`untracked()` doit être utilisé quand la lecture sert à comparer, journaliser ou décider localement sans déclencher la réexécution.

L'usage doit rester explicite et rare : si la valeur lue doit réellement piloter le recalcul, il ne faut pas la masquer avec `untracked()`.

### Exposer l'état mutable avec `.asReadonly()`

Une façade qui porte un état interne expose ses signals en lecture seule avec `.asReadonly()` quand les composants n'ont pas à modifier directement cet état.

Les mutations passent par des méthodes nommées de la façade. Cela garde une surface publique lisible et évite que plusieurs composants écrivent dans le même état sans intention métier explicite.

### Utiliser les hooks post-rendu pour les opérations DOM post-action

`afterNextRender()` est adapté aux opérations DOM one-shot après une action utilisateur : scroll, focus après ajout, mesure ponctuelle.

`afterRender()` est réservé aux traitements récurrents après chaque rendu. Il doit rester rare, car il peut devenir coûteux si le rendu est fréquent.

Un `effect()` reste préférable quand l'objectif est de réagir à un changement d'état plutôt qu'à l'écriture effective du DOM.

### Ne pas migrer vers le mode zoneless

Le mode zoneless (`provideZonelessChangeDetection()`) est stable en Angular 21, mais il exige que chaque changement passe par un déclencheur connu d'Angular.

Supprimer Zone.js trop tôt rendrait la migration plus risquée : l'application contient encore du code classique, des handlers template et des flux asynchrones qui s'appuient sur le comportement historique d'Angular.

La base conserve donc `zone.js` + `OnPush`. La migration vers le mode zoneless reste possible plus tard, une fois l'état principal piloté par Signals et les déclencheurs de changement explicités.
