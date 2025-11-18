import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Observable, of, tap, catchError, finalize, throwError } from 'rxjs';
import { Client } from '@app/models/client';
import { ClientUpdate } from '@app/types/client.types';
import { toObservable } from '@angular/core/rxjs-interop';
import { ClientsApiService } from '@app/services/clients-api.service';
import { Movement } from '@app/models/movement';
import { listClients, getWeeklyClients, paginateClients } from '@app/utils/clients-collection.util';

@Injectable({
  providedIn: 'root'
})
export class ClientsStore {
  private readonly _clients = signal<Client[]>([]);
  private readonly _search = signal<string>('');
  private readonly _loading = signal<boolean>(false);
  private readonly _mutating = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _page = signal<number>(1);
  private readonly _pageSize = signal<number>(20);
  readonly clients = this._clients.asReadonly();
  readonly search = this._search.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly mutating = this._mutating.asReadonly();
  readonly error = this._error.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  private readonly normalizedSearch = computed(() => (this._search() ?? '').trim());

  // Queries replaced by pure utility functions

  readonly sortedClients = computed<Client[]>(() => listClients(this._clients(), ''));

  private readonly pageSlice = computed(() =>
    paginateClients({
      clients: this._clients(),
      search: this.normalizedSearch(),
      page: this._page(),
      pageSize: this._pageSize(),
    })
  );

  readonly filteredClients = computed<Client[]>(() => listClients(this._clients(), this.normalizedSearch()));

  readonly weeklyFilteredClients = computed<Client[]>(() => getWeeklyClients(this._clients(), this.normalizedSearch()));

  readonly totalClients = computed(() => this.pageSlice().total);
  readonly totalPages = computed(() => this.pageSlice().totalPages);
  readonly paginatedClients = computed<Client[]>(() => this.pageSlice().items);

  private clientsApi = inject(ClientsApiService);

  constructor() {
    // Initial load from API into signal store
    effect(() => {
      const totalPages = this.totalPages();
      const current = this._page();
      if (current > totalPages) {
        this._page.set(Math.max(1, totalPages));
      }
    });

    this.refresh().subscribe();
  }

  public refresh(): Observable<Client[]> {
    this._loading.set(true);
    this._error.set(null);
    return this.clientsApi.getAll().pipe(
      tap((data) => {
        this._clients.set(data);
        this._page.set(1);
      }),
      catchError((err) => {
        this._clients.set([]);
        const message = err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement des clients';
        this._error.set(message);
        return of([] as Client[]);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  getClients(): Observable<Client[]> {
    return toObservable(this.clients);
  }

  setSearch(term: string): void {
    this._search.set(term ?? '');
    this._page.set(1);
  }

  setPage(page: number): void {
    const target = Math.max(1, Math.min(page, this.totalPages()));
    this._page.set(target);
  }

  nextPage(): void {
    this.setPage(this._page() + 1);
  }

  previousPage(): void {
    this.setPage(this._page() - 1);
  }

  setPageSize(size: number): void {
    const nextSize = Math.max(1, Math.floor(size));
    if (nextSize !== this._pageSize()) {
      this._pageSize.set(nextSize);
      this._page.set(1);
    }
  }

  getClientById(id: string): Observable<Client> {
    return this.clientsApi.getById(id);
  }

  // Removed searchByName in favor of template pipe

  // Clients CRUD
  addClient(client: Omit<Client, 'id' | 'movements'>): Observable<Client> {
    return this.runMutation(
      this.clientsApi.add(client).pipe(
        tap((created) => {
          this._clients.update((list) => [
            created,
            ...list.filter((c) => c.id !== created.id),
          ]);
          this._page.set(1);
        })
      )
    );
  }

  updateClient(update: ClientUpdate): Observable<Client> {
    const { id } = update;
    return this.runMutation(
      this.clientsApi.update(update).pipe(
        tap((updated) => {
          this._clients.update((list) => list.map((c) => (c.id === id ? { ...c, ...updated } : c)));
        })
      )
    );
  }

  deleteClient(id: string): Observable<void> {
    return this.runMutation(
      this.clientsApi.remove(id).pipe(
        tap(() => {
          this._clients.update((list) => list.filter((c) => c.id !== id));
        })
      )
    );
  }

  // Movements mutations reflected in store
  addMovementToClient(clientId: string, movement: Movement): void {
    this._clients.update((list) =>
      list.map((c) =>
        c.id === clientId
          ? {
              ...c,
              movements: [movement, ...((c.movements ?? []).filter((m) => m.id !== movement.id))],
            }
          : c
      )
    );
  }

  updateMovementInClient(clientId: string, movement: Movement): void {
    this._clients.update((list) =>
      list.map((c) =>
        c.id === clientId
          ? {
              ...c,
              movements: (c.movements ?? []).map((m) => (m.id === movement.id ? movement : m)),
            }
          : c
      )
    );
  }

  removeMovementFromClient(clientId: string, movementId: string): void {
    this._clients.update((list) =>
      list.map((c) =>
        c.id === clientId
          ? { ...c, movements: (c.movements ?? []).filter((m) => m.id !== movementId) }
          : c
      )
    );
  }

  private runMutation<T>(operation: Observable<T>): Observable<T> {
    this._mutating.set(true);
    this._error.set(null);
    return operation.pipe(
      catchError((err) => {
        const message = err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise a jour';
        this._error.set(message);
        return throwError(() => err);
      }),
      finalize(() => this._mutating.set(false))
    );
  }

  // Selectors
  selectClientById(idOrSig: string | (() => string | null) | import('@angular/core').Signal<string | null>): import('@angular/core').Signal<Client | null> {
    return computed(() => {
      const id = typeof idOrSig === 'string'
        ? idOrSig
        : typeof idOrSig === 'function'
          ? (idOrSig as () => string | null)()
          : (idOrSig as import('@angular/core').Signal<string | null>)();
      if (!id) return null;
      const list = this._clients();
      return list.find((c) => c.id === id) ?? null;
    });
  }

  selectClientBalance(idOrSig: string | (() => string | null) | import('@angular/core').Signal<string | null>): import('@angular/core').Signal<number> {
    const clientSig = this.selectClientById(idOrSig as any);
    return computed(() => {
      const client = clientSig();
      if (!client) return 0;
      const movements = client.movements ?? [];
      let total = 0;
      for (const m of movements) {
        total += m.type === 'credit' ? m.amount : -m.amount;
      }
      return Math.round(total * 100) / 100;
    });
  }
}
