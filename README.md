# DojoAngularTest

Angular 19 demo application with a pragmatic, service + store oriented structure (no DDD layering).

## Development server

```bash
ng serve
```

Open `http://localhost:4200/` and the app reloads on file changes.

## Code scaffolding

```bash
ng generate component component-name
```

Run `ng generate --help` to list all schematics (components, directives, pipes, etc.).

## Building

```bash
ng build
```

Artifacts are emitted to `dist/` with production optimisations enabled by default.

## Tests

Run unit tests with Jest:

```bash
npm test
```

## Architecture

Feature structure (example: clients):

```
src/app/clients
  models/         # Typescript models
  types/          # Helper types
  utils/          # Pure utilities (sorting, filtering, etc.)
  repositories/   # Abstractions + HTTP implementations
    http/
  stores/         # Signal store for local/paginated state
  queries/        # Pure queries (projections)
  components/     # Standalone UI building blocks
  pages/          # Standalone routed pages
  clients.service.ts  # Single service consumed by components
```

Cross-feature services/components:

- `NotificationService` + `<app-notification>` for toasts.
- `ConfirmService` + `<app-confirm-dialog>` for accessible confirmations.
- `@angular/cdk/scrolling` activates virtual scroll above 100 clients; otherwise classic pagination is used.

## Additional resources

- [Angular CLI docs](https://angular.dev/tools/cli)
- [Angular Signals guide](https://angular.dev/guide/signals)
- [Angular CDK Scrolling](https://material.angular.io/cdk/scrolling/overview)



