import { Account } from '@accounts/models/account';
import { Movement } from '@accounts/models/movement';
import { ClientRecord } from './mock-api.types';

export function ensureAccounts(db: ClientRecord[]): void {
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

export function getAccountsForClient(client: ClientRecord): Account[] {
  if (!Array.isArray(client.accounts)) {
    client.accounts = seedAccountsForClient(client).map(recalculateAccount);
  }
  return client.accounts;
}

export function replaceAccount(client: ClientRecord, account: Account): Account {
  const accounts = getAccountsForClient(client);
  const index = accounts.findIndex((candidate) => candidate.id === account.id);
  if (index >= 0) {
    accounts[index] = account;
  }
  return account;
}

export function recalculateAccount(account: Account): Account {
  return {
    ...account,
    balance: balanceOf(account.movements),
  };
}

export function syncClientMovements(client: ClientRecord): void {
  client.movements = getAccountsForClient(client).flatMap((account) => account.movements);
}

export function balanceOf(movements: Movement[]): number {
  const total = movements.reduce(
    (sum, movement) => sum + (movement.type === 'credit' ? movement.amount : -movement.amount),
    0
  );
  return Math.round(total * 100) / 100;
}

export function updateMovementForAccount(
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

export function removeMovementFromAccount(client: ClientRecord, accountId: string, movementId: string): Account | null {
  const account = getAccountsForClient(client).find((candidate) => candidate.id === accountId);
  if (!account) return null;

  const before = account.movements.length;
  account.movements = account.movements.filter((movement) => movement.id !== movementId);
  if (account.movements.length === before) return null;

  const updated = replaceAccount(client, recalculateAccount(account));
  syncClientMovements(client);
  return updated;
}

export function toValidAmount(value: unknown, fallback: number): number {
  const amount = Number(value ?? fallback);
  return Number.isFinite(amount) ? Math.max(0, amount) : fallback;
}

export function toPositiveAmount(value: unknown): number | null {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function hasInvalidAmount(patch: Partial<Movement>): boolean {
  return patch.amount !== undefined && toPositiveAmount(patch.amount) === null;
}

export function isMovementType(value: unknown): value is Movement['type'] {
  return value === 'credit' || value === 'debit';
}

export function isAccountType(value: unknown): value is Account['type'] {
  return value === 'checking' || value === 'saving' || value === 'joint';
}

export function isAccountStatus(value: unknown): value is Account['status'] {
  return value === 'active' || value === 'blocked' || value === 'closed';
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
  const savingBalance = Math.max(250, Math.round((Math.abs(balanceOf(savingMovements)) + suffix.length * 42) * 100) / 100);

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
