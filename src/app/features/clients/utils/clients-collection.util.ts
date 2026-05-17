import { ClientActivity } from '@clients/models/client-activity';
import { matchesSearchTerm, sortByLatestMovement, sortWeeklyByLatestMovement } from '@clients/utils/client.util';

export function listClients(clients: ClientActivity[], search?: string): ClientActivity[] {
  const sorted = sortByLatestMovement(clients);
  const term = (search ?? '').trim();
  return term ? sorted.filter((c) => matchesSearchTerm(c, term)) : sorted;
}

export function getWeeklyClients(clients: ClientActivity[], search?: string, referenceDate?: Date): ClientActivity[] {
  const sorted = sortWeeklyByLatestMovement(clients, referenceDate);
  const term = (search ?? '').trim();
  return term ? sorted.filter((c) => matchesSearchTerm(c, term)) : sorted;
}

export interface ClientsPageParams {
  clients: ClientActivity[];
  page: number;
  pageSize: number;
  search?: string;
}

export interface ClientsPageResult {
  items: ClientActivity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function paginateClients(params: ClientsPageParams): ClientsPageResult {
  const { clients, page, pageSize, search } = params;
  const currentPage = Math.max(1, page);
  const size = Math.max(1, Math.floor(pageSize));
  const filtered = listClients(clients, search);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / size) || 1);
  const clampedPage = Math.min(currentPage, totalPages);
  const start = (clampedPage - 1) * size;
  const items = filtered.slice(start, start + size);
  return { items, total, page: clampedPage, pageSize: size, totalPages };
}

