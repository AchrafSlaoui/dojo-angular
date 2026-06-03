# ADR 0002 - Conventions d'usage des primitives Signals et stratégie de détection de changement

## Contexte

Le dojo introduit plusieurs primitives Signals (`signal()`, `computed()`, `effect()`, `toSignal()`). Sans conventions explicites, un apprenant peut les utiliser de manière interchangeable ou bridger RxJS et Signals par réflexe. Des règles d'usage claires évitent ces écueils pédagogiques.

Par ailleurs, Angular 21 propose un mode zoneless stable. La question de supprimer Zone.js s'est posée lors de la préparation du dojo.

## Décisions

### `computed()` est un calcul pur — jamais d'effet de bord

`computed()` ne doit pas déclencher d'appel HTTP, écrire dans un signal, ou produire un effet observable. C'est une valeur dérivée mémorisée. Si un effet est nécessaire, `effect()` est l'outil adapté.

### `effect()` est un effet de bord — jamais une valeur exposée

`effect()` ne retourne rien d'utilisable. Il réagit à des changements pour produire un effet (focus, titre du document, log). Exposer une valeur via `effect()` indique que `computed()` était le bon choix.

### L'enfant émet une intention, le parent exécute l'action

`output()` sert à signaler une intention (`deleteRequested`, `saveRequested`). La décision d'agir appartient au parent. Les enfants ne dépendent pas de services pour exécuter des actions.

### Ne pas bridger Signals et RxJS systématiquement

`toSignal()` et `toObservable()` sont des ponts ponctuels, pas une règle générale. Ils sont justifiés quand un opérateur temporel (debounce) ou un Observable HTTP doit être consommé dans un contexte signal. Rester dans un seul monde quand c'est possible.

### `toSignal()` gère le désabonnement — ne pas ajouter `takeUntilDestroyed`

`toSignal()` souscrit et se désabonne automatiquement dans le contexte d'injection. Ajouter `takeUntilDestroyed` en plus est redondant et source de confusion.

### `input()` dans un `computed()` crée une dépendance réelle — `@Input()` non

Un `@Input()` classique lu dans un `computed()` ne crée pas de dépendance réactive : Angular ne recalculera pas la valeur dérivée quand l'entrée change. `input()` dans un `computed()` est une dépendance réelle et sera réévalué si la valeur du parent change.

### Ne pas migrer vers le mode zoneless pour ce dojo

Le mode zoneless (`provideZonelessChangeDetection()`) est stable en Angular 21, mais il exige que chaque changement passe par un déclencheur connu d'Angular. Supprimer Zone.js ici cacherait la réalité d'une migration progressive : la plupart des projets existants ont encore Zone.js et du code classique.

Le dojo conserve Zone.js + `OnPush` pour montrer que Signals peut coexister avec l'existant, sans forcer une réécriture complète. La migration vers le mode zoneless est la suite logique une fois l'état principal piloté par Signals, mais elle est hors périmètre de ce dojo.
