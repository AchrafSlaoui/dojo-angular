import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Account } from '@accounts/models/account';
import { Movement } from '@accounts/models/movement';
import { Client } from '@clients/models/client';
import { ClientActivity } from '@clients/models/client-activity';

type ClientRecord = Client & { accounts?: Account[]; movements?: Movement[] };

let DB: ClientRecord[] | null = null;
const STORAGE_KEY = 'dojo-angular-2-mock';
const STORAGE_VERSION_KEY = 'dojo-angular-2-mock-version';
const DATA_VERSION = 3;

export function mockApiInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const response = handleMockApiRequest(req);
  return response ?? next(req);
}

export function resetMockApiStateForTests(): void {
  DB = null;
}

function handleMockApiRequest(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> | null {
  const path = toPath(req.url);
  if (!path.startsWith('/api/')) {
    return null;
  }

  ensureDb();
  const method = req.method.toUpperCase();

  if (method === 'GET' && /^\/api\/clients\/?$/.test(path)) {
    if (!DB || DB.length === 0) {
      DB = seedData();
    }
    return ok(DB.map(toClientActivity));
  }

  if (method === 'POST' && /^\/api\/clients\/?$/.test(path)) {
    const body = (req.body as Partial<Client>) || {};
    const client: ClientRecord = {
      id: uuid(),
      firstName: String(body.firstName ?? 'Nouveau'),
      lastName: String(body.lastName ?? 'Client'),
      email: String(
        body.email ??
          `${slugName(String(body.firstName ?? 'nouveau'))}.${slugName(String(body.lastName ?? 'client'))}@example.com`
      ),
      phone: String(body.phone ?? ''),
      address: String(body.address ?? ''),
      accounts: [],
    };
    DB = DB ?? [];
    DB.unshift(client);
    persist();
    return created(toClient(client));
  }

  const mUpdateClient = path.match(/^\/api\/clients\/([^\/]+)$/);
  if (method === 'PUT' && mUpdateClient) {
    const id = decodeURIComponent(mUpdateClient[1]);
    const idx = DB!.findIndex((c) => c.id === id);
    if (idx < 0) return notFound();
    const original = DB![idx];
    const patch = (req.body as Partial<Client>) || {};
    const updated: ClientRecord = {
      ...original,
      firstName: patch.firstName ?? original.firstName,
      lastName: patch.lastName ?? original.lastName,
      email: patch.email ?? original.email,
      phone: patch.phone ?? original.phone,
      address: patch.address ?? original.address,
    };
    DB![idx] = updated;
    persist();
    return ok(updated);
  }

  const mDeleteClient = path.match(/^\/api\/clients\/([^\/]+)$/);
  if (method === 'DELETE' && mDeleteClient) {
    const id = decodeURIComponent(mDeleteClient[1]);
    const before = DB!.length;
    DB = DB!.filter((c) => c.id !== id);
    if (DB!.length === before) return notFound();
    persist();
    return noContent();
  }

  const mClient = path.match(/^\/api\/clients\/([^\/]+)$/);
  if (method === 'GET' && mClient) {
    const id = decodeURIComponent(mClient[1]);
    const client = DB!.find((c) => c.id === id);
    return client ? ok(toClient(client)) : notFound();
  }

  const mClientAccounts = path.match(/^\/api\/clients\/([^\/]+)\/accounts$/);
  if (method === 'GET' && mClientAccounts) {
    const id = decodeURIComponent(mClientAccounts[1]);
    const client = DB!.find((c) => c.id === id);
    return client ? ok(getAccountsForClient(client)) : notFound();
  }

  if (method === 'POST' && mClientAccounts) {
    const id = decodeURIComponent(mClientAccounts[1]);
    const client = DB!.find((c) => c.id === id);
    if (!client) return notFound();

    const body = (req.body as Partial<Account>) || {};
    const account: Account = recalculateAccount({
      id: `acc-${uuid()}`,
      clientId: client.id,
      label: String(body.label ?? 'Nouveau compte'),
      type: isAccountType(body.type) ? body.type : 'checking',
      status: isAccountStatus(body.status) ? body.status : 'active',
      balance: 0,
      currency: 'EUR',
      movements: [],
    });

    getAccountsForClient(client).unshift(account);
    syncClientMovements(client);
    persist();
    return created(account);
  }

  const mClientAccount = path.match(/^\/api\/clients\/([^\/]+)\/accounts\/([^\/]+)$/);
  if (method === 'GET' && mClientAccount) {
    const clientId = decodeURIComponent(mClientAccount[1]);
    const accountId = decodeURIComponent(mClientAccount[2]);
    const client = DB!.find((c) => c.id === clientId);
    if (!client) return notFound();
    const account = getAccountsForClient(client).find((candidate) => candidate.id === accountId);
    return account ? ok(account) : notFound();
  }

  if (method === 'PUT' && mClientAccount) {
    const clientId = decodeURIComponent(mClientAccount[1]);
    const accountId = decodeURIComponent(mClientAccount[2]);
    const client = DB!.find((c) => c.id === clientId);
    if (!client) return notFound();

    const accounts = getAccountsForClient(client);
    const index = accounts.findIndex((account) => account.id === accountId);
    if (index < 0) return notFound();

    const original = accounts[index];
    const patch = (req.body as Partial<Account>) || {};
    const updated = recalculateAccount({
      ...original,
      label: typeof patch.label === 'string' ? patch.label : original.label,
      type: isAccountType(patch.type) ? patch.type : original.type,
      status: isAccountStatus(patch.status) ? patch.status : original.status,
    });

    accounts[index] = updated;
    syncClientMovements(client);
    persist();
    return ok(updated);
  }

  if (method === 'DELETE' && mClientAccount) {
    const clientId = decodeURIComponent(mClientAccount[1]);
    const accountId = decodeURIComponent(mClientAccount[2]);
    const client = DB!.find((c) => c.id === clientId);
    if (!client) return notFound();

    const accounts = getAccountsForClient(client);
    const before = accounts.length;
    client.accounts = accounts.filter((account) => account.id !== accountId);
    if (client.accounts.length === before) return notFound();

    syncClientMovements(client);
    persist();
    return noContent();
  }

  const mAccountMovements = path.match(/^\/api\/clients\/([^\/]+)\/accounts\/([^\/]+)\/movements$/);
  if (method === 'POST' && mAccountMovements) {
    const clientId = decodeURIComponent(mAccountMovements[1]);
    const accountId = decodeURIComponent(mAccountMovements[2]);
    const client = DB!.find((c) => c.id === clientId);
    if (!client) return notFound();

    const account = getAccountsForClient(client).find((candidate) => candidate.id === accountId);
    if (!account) return notFound();

    const body = (req.body as Partial<Movement>) || {};
    const amount = toPositiveAmount(body.amount);
    if (amount === null) return badRequest();

    account.movements.unshift({
      id: uuid(),
      date: typeof body.date === 'string' ? body.date : formatDate(new Date()),
      type: isMovementType(body.type) ? body.type : 'credit',
      amount,
      description: typeof body.description === 'string' ? body.description : '',
    });

    const updated = replaceAccount(client, recalculateAccount(account));
    syncClientMovements(client);
    persist();
    return created(updated);
  }

  const mUpdateAccountMovement = path.match(
    /^\/api\/clients\/([^\/]+)\/accounts\/([^\/]+)\/movements\/([^\/]+)$/
  );
  if (method === 'PUT' && mUpdateAccountMovement) {
    const clientId = decodeURIComponent(mUpdateAccountMovement[1]);
    const accountId = decodeURIComponent(mUpdateAccountMovement[2]);
    const movementId = decodeURIComponent(mUpdateAccountMovement[3]);
    const client = DB!.find((c) => c.id === clientId);
    if (!client) return notFound();
    if (hasInvalidAmount((req.body as Partial<Movement>) || {})) return badRequest();

    const account = updateMovementForAccount(client, accountId, movementId, (req.body as Partial<Movement>) || {});
    if (!account) return notFound();

    persist();
    return ok(account);
  }

  if (method === 'DELETE' && mUpdateAccountMovement) {
    const clientId = decodeURIComponent(mUpdateAccountMovement[1]);
    const accountId = decodeURIComponent(mUpdateAccountMovement[2]);
    const movementId = decodeURIComponent(mUpdateAccountMovement[3]);
    const client = DB!.find((c) => c.id === clientId);
    if (!client) return notFound();

    const account = removeMovementFromAccount(client, accountId, movementId);
    if (!account) return notFound();

    persist();
    return ok(account);
  }

  return null;
}

function ensureDb(): void {
  if (DB) return;

  const version = Number(localStorage.getItem(STORAGE_VERSION_KEY) ?? '0');
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached && version === DATA_VERSION) {
    try {
      DB = JSON.parse(cached) as ClientRecord[];
    } catch {
      DB = seedData();
    }
  } else {
    DB = seedData();
  }

  if (!Array.isArray(DB) || DB.length === 0) {
    DB = seedData();
  }
  ensureHumanNames(DB);
  ensureAccounts(DB);
  persist();
}

function ok<T>(body: T): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status: 200, body }));
}

function created<T>(body: T): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status: 201, body }));
}

function notFound(): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status: 404 }));
}

function badRequest(): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status: 400 }));
}

function noContent(): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status: 204 }));
}

const FIRST_NAMES = [
  'Jean','Marie','Pierre','Sophie','Antoine','Louis','Emma','Lucas','Camille','Julien','Thomas','Nicolas',
  'Claire','Pauline','Hugo','Arthur','Lea','Chloe','Manon','Sarah','Victor','Mathis','Baptiste','Gabriel',
  'Jules','Martin','Elodie','Celine','Marine','Adrien','Romain','Maxime','Quentin','Theo','Noemie',
  'Charlotte','Elise','Anais','Florian','Valentin','Guillaume','Alexis','Margaux','Lucie','Eva','Nathan',
  'Leo','Paul','Jeanne','Agathe'
];
const LAST_NAMES = [
  'Dupont','Martin','Bernard','Petit','Robert','Richard','Durand','Dubois','Moreau','Laurent','Simon',
  'Michel','Lefebvre','Leroy','Roux','David','Bertrand','Morel','Fournier','Girard','Bonnet','Dupuis',
  'Lambert','Fontaine','Chevalier','Robin','Gauthier','Poirier','Lemoine','Renaud','Renard','Marchand',
  'Morin','Noel','Dumont','Blanc','Guerin','Muller','Henry','Roussel','Nicolas','Perrin','Mathieu',
  'Clement','Garcia','Faure','Olivier','Carpentier','Gonzalez','Barbier'
];
const CITY_POOL = [
  'Paris','Lyon','Marseille','Toulouse','Bordeaux','Lille','Nantes','Strasbourg','Montpellier','Nice',
  'Rennes','Grenoble','Dijon','Angers','Reims','Le Havre','Saint-Etienne','Toulon','Clermont-Ferrand',
  'Aix-en-Provence','Nancy','Tours','Avignon','Amiens','Metz','Besancon','Orleans','Brest','Caen','Limoges'
];

function seedData(): ClientRecord[] {
  const clients: ClientRecord[] = [
    {
      id: 'c1',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+331700000001',
      address: 'Paris, France',
      movements: [
        { id: uuid(), date: formatDate(new Date()), type: 'credit', amount: 1200, description: 'Salaire' },
        { id: uuid(), date: formatDate(daysAgo(3)), type: 'debit', amount: 200, description: 'Courses' },
      ],
    },
    {
      id: 'c2',
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com',
      phone: '+331700000002',
      address: 'Lyon, France',
      movements: [
        { id: uuid(), date: formatDate(daysAgo(2)), type: 'debit', amount: 150, description: 'Restaurant' },
        { id: uuid(), date: formatDate(daysAgo(20)), type: 'credit', amount: 500, description: 'Vente' },
      ],
    },
  ];

  while (clients.length < 50) {
    const idx = clients.length + 1;
    const { first, last } = pickName(clients.length);
    const city = CITY_POOL[clients.length % CITY_POOL.length];
    clients.push({
      id: `c-${idx}`,
      firstName: first,
      lastName: last,
      email: `${slugName(first)}.${slugName(last)}@example.com`,
      phone: `+3301${String(100000 + idx).slice(-6)}`,
      address: city,
      movements: randomMovements(),
    });
  }

  ensureHumanNames(clients);
  ensureMovementsThisWeek(clients);
  ensureAccounts(clients);
  return clients;
}

function pickName(i: number): { first: string; last: string } {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i * 7) % LAST_NAMES.length];
  return { first, last };
}

function ensureHumanNames(db: ClientRecord[]): void {
  for (let i = 0; i < db.length; i++) {
    const c = db[i];
    if (/^Client\d+$/i.test(c.firstName)) {
      const { first, last } = pickName(i);
      c.firstName = first;
      c.lastName = last;
      c.email = `${slugName(first)}.${slugName(last)}@example.com`;
      c.address = CITY_POOL[i % CITY_POOL.length];
    }
  }
}

function ensureMovementsThisWeek(clients: ClientRecord[]): void {
  const { monday, sunday } = weekRange(new Date());
  for (let i = 0; i < Math.min(10, clients.length); i++) {
    const c = clients[i];
    const movements = c.movements ?? [];
    const hasThisWeek = movements.some((movement) => {
      const date = new Date(movement.date);
      return date >= monday && date <= sunday;
    });
    if (!hasThisWeek) {
      movements.unshift({
        id: uuid(),
        date: formatDate(new Date()),
        type: Math.random() > 0.5 ? 'credit' : 'debit',
        amount: Math.round((50 + Math.random() * 950) * 100) / 100,
        description: 'Mouvement demo',
      });
      c.movements = movements;
    }
  }
}

function randomMovements(): Movement[] {
  const count = 1 + Math.floor(Math.random() * 3);
  const arr: Movement[] = [];
  for (let i = 0; i < count; i++) {
    const d = daysAgo(7 + Math.floor(Math.random() * 60));
    arr.push({
      id: uuid(),
      date: formatDate(d),
      type: Math.random() > 0.5 ? 'credit' : 'debit',
      amount: Math.round((10 + Math.random() * 990) * 100) / 100,
      description: 'Ancien mouvement',
    });
  }
  return arr;
}

function ensureAccounts(db: ClientRecord[]): void {
  for (const client of db) {
    if (!Array.isArray(client.accounts)) {
      client.accounts = seedAccountsForClient(client).map(recalculateAccount);
    } else {
      client.accounts = client.accounts.map((account) =>
        recalculateAccount({
          ...account,
          clientId: client.id,
          currency: 'EUR',
          movements: Array.isArray(account.movements) ? account.movements : [],
        })
      );
    }
    syncClientMovements(client);
  }
}

function getAccountsForClient(client: ClientRecord): Account[] {
  if (!Array.isArray(client.accounts)) {
    client.accounts = seedAccountsForClient(client).map(recalculateAccount);
  }
  return client.accounts;
}

function replaceAccount(client: ClientRecord, account: Account): Account {
  const accounts = getAccountsForClient(client);
  const index = accounts.findIndex((candidate) => candidate.id === account.id);
  if (index >= 0) {
    accounts[index] = account;
  }
  return account;
}

function recalculateAccount(account: Account): Account {
  return {
    ...account,
    balance: balanceOf(account.movements),
  };
}

function syncClientMovements(client: ClientRecord): void {
  client.movements = getAccountsForClient(client).flatMap((account) => account.movements);
}

function balanceOf(movements: Movement[]): number {
  const total = movements.reduce(
    (sum, movement) => sum + (movement.type === 'credit' ? movement.amount : -movement.amount),
    0
  );
  return Math.round(total * 100) / 100;
}

function updateMovementForAccount(
  client: ClientRecord,
  accountId: string,
  movementId: string,
  patch: Partial<Movement>
): Account | null {
  const account = getAccountsForClient(client).find((candidate) => candidate.id === accountId);
  if (!account) return null;

  const index = account.movements.findIndex((movement) => movement.id === movementId);
  if (index < 0) return null;

  const original = account.movements[index];
  const amount = toValidAmount(patch.amount, original.amount);

  account.movements[index] = {
    ...original,
    date: typeof patch.date === 'string' ? patch.date : original.date,
    type: isMovementType(patch.type) ? patch.type : original.type,
    amount,
    description: typeof patch.description === 'string' ? patch.description : original.description,
  };

  const updated = replaceAccount(client, recalculateAccount(account));
  syncClientMovements(client);
  return updated;
}

function removeMovementFromAccount(client: ClientRecord, accountId: string, movementId: string): Account | null {
  const account = getAccountsForClient(client).find((candidate) => candidate.id === accountId);
  if (!account) return null;

  const before = account.movements.length;
  account.movements = account.movements.filter((movement) => movement.id !== movementId);
  if (account.movements.length === before) return null;

  const updated = replaceAccount(client, recalculateAccount(account));
  syncClientMovements(client);
  return updated;
}

function seedAccountsForClient(client: ClientRecord): Account[] {
  const suffix = client.id;
  const sourceMovements = client.movements ?? [];
  const checkingMovements = sourceMovements.filter((_, index) => index % 3 !== 1);
  const savingMovements = sourceMovements.filter((_, index) => index % 3 === 1);
  const jointMovements = sourceMovements.filter((_, index) => index % 5 === 0).map((movement) => ({
    ...movement,
    id: `${movement.id}-joint`,
    amount: Math.round(movement.amount * 0.3 * 100) / 100,
  }));
  const savingBalance = Math.max(
    250,
    Math.round((Math.abs(balanceOf(savingMovements)) + suffix.length * 42) * 100) / 100
  );

  return [
    {
      id: `acc-${client.id}-checking`,
      clientId: client.id,
      label: `Compte courant ${client.firstName}`,
      type: 'checking',
      status: 'active',
      balance: balanceOf(checkingMovements),
      currency: 'EUR',
      movements: checkingMovements,
    },
    {
      id: `acc-${client.id}-saving`,
      clientId: client.id,
      label: `Livret ${client.lastName}`,
      type: 'saving',
      status: 'active',
      balance: savingBalance,
      currency: 'EUR',
      movements: savingMovements,
    },
    {
      id: `acc-${client.id}-joint`,
      clientId: client.id,
      label: 'Compte joint',
      type: 'joint',
      status: suffix.length % 5 === 0 ? 'blocked' : 'active',
      balance: Math.round((balanceOf(jointMovements) + suffix.length * 12) * 100) / 100,
      currency: 'EUR',
      movements: jointMovements,
    },
  ];
}

function toValidAmount(value: unknown, fallback: number): number {
  const amount = Number(value ?? fallback);
  return Number.isFinite(amount) ? Math.max(0, amount) : fallback;
}

function toPositiveAmount(value: unknown): number | null {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function hasInvalidAmount(patch: Partial<Movement>): boolean {
  return patch.amount !== undefined && toPositiveAmount(patch.amount) === null;
}

function isMovementType(value: unknown): value is Movement['type'] {
  return value === 'credit' || value === 'debit';
}

function isAccountType(value: unknown): value is Account['type'] {
  return value === 'checking' || value === 'saving' || value === 'joint';
}

function isAccountStatus(value: unknown): value is Account['status'] {
  return value === 'active' || value === 'blocked' || value === 'closed';
}

function toClient(client: ClientRecord): Client {
  const { accounts: _accounts, movements: _movements, ...rest } = client;
  return rest;
}

function toClientActivity(client: ClientRecord): ClientActivity {
  return {
    ...toClient(client),
    recentMovements: getAccountsForClient(client).flatMap((account) => account.movements),
  };
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
    localStorage.setItem(STORAGE_VERSION_KEY, String(DATA_VERSION));
  } catch {}
}

function slugName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function weekRange(ref: Date): { monday: Date; sunday: Date } {
  const now = new Date(ref);
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function toPath(url: string): string {
  try {
    const origin = (globalThis as typeof globalThis & { location?: Location }).location?.origin ?? 'http://local';
    const u = new URL(url, origin);
    return u.pathname;
  } catch {
    return url.replace(/^[a-zA-Z]+:\/\/[^/]+/, '');
  }
}
