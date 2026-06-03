import { ClientActivity } from '@clients/models/client-activity';
import { matchesSearchTerm, sortByLatestMovement, sortByTotalMovementAmount, sortWeeklyByLatestMovement } from '@clients/utils/client.util';

export type ClientSort = 'latestMovement' | 'totalMovementsDesc' | 'totalMovementsAsc';

export function listClients(clients: ClientActivity[], search?: string, sort: ClientSort = 'latestMovement'): ClientActivity[] {
  const sorted = sortClients(clients, sort);
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
  sort?: ClientSort;
}

export interface ClientsPageResult {
  items: ClientActivity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function paginateClients(params: ClientsPageParams): ClientsPageResult {
  const { clients, page, pageSize, search, sort } = params;
  const currentPage = Math.max(1, page);
  const size = Math.max(1, Math.floor(pageSize));
  const filtered = listClients(clients, search, sort);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / size) || 1);
  const clampedPage = Math.min(currentPage, totalPages);
  const start = (clampedPage - 1) * size;
  const items = filtered.slice(start, start + size);
  return { items, total, page: clampedPage, pageSize: size, totalPages };
}

function sortClients(clients: ClientActivity[], sort: ClientSort): ClientActivity[] {
  switch (sort) {
    case 'totalMovementsAsc':
      return sortByTotalMovementAmount(clients, 'asc');
    case 'totalMovementsDesc':
      return sortByTotalMovementAmount(clients, 'desc');
    case 'latestMovement':
    default:
      return sortByLatestMovement(clients);
  }
}

