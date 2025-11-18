
import { Client } from '@app/models/client';
import { weekRange } from '@shared/utils/date.util';

export function latestMovementDate(client: Client): number {
  let max = -Infinity;
  for (const m of client.movements ?? []) {
    const t = new Date(m.date).getTime();
    if (t > max) max = t;
  }
  return max;
}

export function latestMovementDateInWeek(client: Client, ref: Date = new Date()): number {
  const { monday, sunday } = weekRange(ref);
  let max = -Infinity;
  for (const m of client.movements ?? []) {
    const d = new Date(m.date);
    if (d >= monday && d <= sunday) {
      const t = d.getTime();
      if (t > max) max = t;
    }
  }
  return max;
}

export function hasMovementThisWeek(client: Client, ref: Date = new Date()): boolean {
  const { monday, sunday } = weekRange(ref);
  return (client.movements ?? []).some((m) => {
    const d = new Date(m.date);
    return d >= monday && d <= sunday;
  });
}

export function sortByLatestMovement(clients: Client[]): Client[] {
  return [...clients].sort((a, b) => latestMovementDate(b) - latestMovementDate(a));
}

export function sortWeeklyByLatestMovement(clients: Client[], ref: Date = new Date()): Client[] {
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
