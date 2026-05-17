import { HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account } from '@accounts/models/account';
import { Client } from '@clients/models/client';
import { ClientActivity } from '@clients/models/client-activity';
import { Movement } from '@accounts/models/movement';
import {
  ensureAccounts,
  getAccountsForClient,
  hasInvalidAmount,
  isAccountStatus,
  isAccountType,
  isMovementType,
  recalculateAccount,
  removeMovementFromAccount,
  replaceAccount,
  syncClientMovements,
  toPositiveAmount,
  updateMovementForAccount,
} from './mock-api.accounts';
import { badRequest, created, noContent, notFound, ok } from './mock-api.http';
import { seedData, ensureHumanNames } from './mock-api.seed';
import { ClientRecord } from './mock-api.types';
import { formatDate, slugName, toPath, uuid } from './mock-api.utils';

let DB: ClientRecord[] | null = null;
const STORAGE_KEY = 'dojo-angular-2-mock';
const STORAGE_VERSION_KEY = 'dojo-angular-2-mock-version';
const DATA_VERSION = 3; // bump to force reseed with persisted accounts

export function resetMockApiStateForTests(): void {
  DB = null;
}

export function handleMockApiRequest(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> | null {
  const path = toPath(req.url);
  if (!path.startsWith('/api/')) {
    return null;
  }

  // Lazy init DB
  if (!DB) {
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
    // Normalize any legacy numeric names from previous seeds
    if (DB) {
      // If cache is empty or invalid, re-seed
      if (!Array.isArray(DB) || DB.length === 0) {
        DB = seedData();
      }
      ensureHumanNames(DB);
      ensureAccounts(DB);
      persist();
    }
  }

  const method = req.method.toUpperCase();

// Routes
// GET /api/clients
  if (method === 'GET' && /^\/api\/clients\/?$/.test(path)) {
    if (!DB || DB.length === 0) {
      DB = seedData();
    }
    return ok(DB.map(toClientActivity));
  }

  // POST /api/clients
  if (method === 'POST' && /^\/api\/clients\/?$/.test(path)) {
    const body = (req.body as Partial<Client>) || {};
    const client: ClientRecord = {
      id: uuid(),
      firstName: String(body.firstName ?? 'Nouveau'),
      lastName: String(body.lastName ?? 'Client'),
      email: String(body.email ?? `${slugName(String(body.firstName ?? 'nouveau'))}.${slugName(String(body.lastName ?? 'client'))}@example.com`),
      phone: String(body.phone ?? ''),
      address: String(body.address ?? ''),
      accounts: []
    };
    DB = DB ?? [];
    DB.unshift(client);
    persist();
    return created(toClient(client));
  }

  // PUT /api/clients/:id
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
      address: patch.address ?? original.address
    };
    DB![idx] = updated;
    persist();
    return ok(updated);
  }

  // DELETE /api/clients/:id
  const mDeleteClient = path.match(/^\/api\/clients\/([^\/]+)$/);
  if (method === 'DELETE' && mDeleteClient) {
    const id = decodeURIComponent(mDeleteClient[1]);
    const before = DB!.length;
    DB = DB!.filter((c) => c.id !== id);
    if (DB!.length === before) return notFound();
    persist();
    return noContent();
  }

  // GET /api/clients/:id
  const mClient = path.match(/^\/api\/clients\/([^\/]+)$/);
  if (method === 'GET' && mClient) {
    const id = decodeURIComponent(mClient[1]);
    const client = DB!.find((c) => c.id === id);
    return client ? ok(toClient(client)) : notFound();
  }

  // GET /api/clients/:id/accounts
  const mClientAccounts = path.match(/^\/api\/clients\/([^\/]+)\/accounts$/);
  if (method === 'GET' && mClientAccounts) {
    const id = decodeURIComponent(mClientAccounts[1]);
    const client = DB!.find((c) => c.id === id);
    return client ? ok(getAccountsForClient(client)) : notFound();
  }

  // POST /api/clients/:id/accounts
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

  // GET /api/clients/:id/accounts/:accountId
  const mClientAccount = path.match(/^\/api\/clients\/([^\/]+)\/accounts\/([^\/]+)$/);
  if (method === 'GET' && mClientAccount) {
    const clientId = decodeURIComponent(mClientAccount[1]);
    const accountId = decodeURIComponent(mClientAccount[2]);
    const client = DB!.find((c) => c.id === clientId);
    if (!client) return notFound();
    const account = getAccountsForClient(client).find((a) => a.id === accountId);
    return account ? ok(account) : notFound();
  }

  // PUT /api/clients/:id/accounts/:accountId
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

  // DELETE /api/clients/:id/accounts/:accountId
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

  // POST /api/clients/:id/accounts/:accountId/movements
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

  // PUT /api/clients/:id/accounts/:accountId/movements/:movementId
  const mUpdateAccountMovement = path.match(/^\/api\/clients\/([^\/]+)\/accounts\/([^\/]+)\/movements\/([^\/]+)$/);
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

  // DELETE /api/clients/:id/accounts/:accountId/movements/:movementId
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

  // Fallback
  return null;
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
