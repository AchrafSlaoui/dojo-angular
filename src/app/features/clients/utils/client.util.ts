
import { Client } from '@clients/models/client';
import { ClientActivity } from '@clients/models/client-activity';
import { weekRange } from '@shared/utils/date.util';

export function latestMovementDate(client: ClientActivity): number {
  let max = -Infinity;
  for (const movement of client.recentMovements ?? []) {
    const t = new Date(movement.date).getTime();
    if (t > max) max = t;
  }
  return max;
}

export function latestMovementDateInWeek(client: ClientActivity, ref: Date = new Date()): number {
  const { monday, sunday } = weekRange(ref);
  let max = -Infinity;
  for (const movement of client.recentMovements ?? []) {
    const d = new Date(movement.date);
    if (d >= monday && d <= sunday) {
      const t = d.getTime();
      if (t > max) max = t;
    }
  }
  return max;
}

export function hasMovementThisWeek(client: ClientActivity, ref: Date = new Date()): boolean {
  const { monday, sunday } = weekRange(ref);
  return (client.recentMovements ?? []).some((movement) => {
    const d = new Date(movement.date);
    return d >= monday && d <= sunday;
  });
}

export function sortByLatestMovement(clients: ClientActivity[]): ClientActivity[] {
  return [...clients].sort((a, b) => latestMovementDate(b) - latestMovementDate(a));
}

export function totalMovementAmount(client: ClientActivity): number {
  return (client.recentMovements ?? []).reduce((total, movement) => total + movement.amount, 0);
}

export function sortByTotalMovementAmount(clients: ClientActivity[], direction: 'asc' | 'desc'): ClientActivity[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...clients].sort((a, b) => {
    const diff = totalMovementAmount(a) - totalMovementAmount(b);
    if (diff !== 0) return diff * factor;
    return latestMovementDate(b) - latestMovementDate(a);
  });
}

export function sortWeeklyByLatestMovement(clients: ClientActivity[], ref: Date = new Date()): ClientActivity[] {
  return clients
    .filter((client) => hasMovementThisWeek(client, ref))
    .sort((a, b) => latestMovementDateInWeek(b, ref) - latestMovementDateInWeek(a, ref));
}

export function matchesSearchTerm(client: Client, term: string): boolean {
  if (!term) return true;
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;
  const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
  return fullName.includes(normalized);
}
