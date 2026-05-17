# Dojo Angular 2

Application Angular 21 standalone servant de base a un dojo Signals et RxJS sur un domaine bancaire.

## Architecture

- `src/app/app.config.ts` : providers applicatifs.
- `src/app/app.routes.ts` : routage lazy standalone.
- `src/app/features/clients` : domaine clients, mouvements, pages, composants, services, modeles et utilitaires.
- `src/app/shared` : services, composants et pipes reutilisables.
- `src/app/core` : infrastructure applicative, dont le mock API.

## Commandes

```bash
npm install
npm start
npm run build
npm test
```

## Objectif Dojo

Le dojo utilisera le domaine bancaire pour illustrer progressivement :

- `signal`, `computed`, `effect`
- `input` et `output`
- RxJS avec HTTP, recherche, debounce et annulation
- interop Signals/RxJS avec `toSignal` et `toObservable`
