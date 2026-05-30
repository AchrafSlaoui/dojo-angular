import { listClients, getWeeklyClients, paginateClients } from './clients-collection.util';
import { ClientActivity } from '@clients/models/client-activity';

describe('clients-collection.util', () => {
  describe('listClients', () => {
    it.each([
      {
        title: 'two clients with latest dates 2024-02-12 > 2024-02-10',
        clients: [
          { id: '1', firstName: 'A', lastName: 'A', recentMovements: [{ id: 'm1', date: '2024-02-10', type: 'credit', amount: 1, description: '' }] },
          { id: '2', firstName: 'B', lastName: 'B', recentMovements: [{ id: 'm2', date: '2024-02-12', type: 'credit', amount: 1, description: '' }] },
        ] as ClientActivity[],
        expected: ['2', '1'],
      },
      {
        title: 'three clients 2024-03-01 > 2024-02-01 > 2024-01-01',
        clients: [
          { id: '1', firstName: 'A', lastName: 'A', recentMovements: [{ id: 'm1', date: '2024-01-01', type: 'credit', amount: 1, description: '' }] },
          { id: '2', firstName: 'B', lastName: 'B', recentMovements: [{ id: 'm2', date: '2024-03-01', type: 'credit', amount: 1, description: '' }] },
          { id: '3', firstName: 'C', lastName: 'C', recentMovements: [{ id: 'm3', date: '2024-02-01', type: 'credit', amount: 1, description: '' }] },
        ] as ClientActivity[],
        expected: ['2', '3', '1'],
      },
      {
        title: 'clients without recentMovements are last',
        clients: [
          { id: '1', firstName: 'A', lastName: 'A', recentMovements: [] },
          { id: '2', firstName: 'B', lastName: 'B', recentMovements: [{ id: 'm2', date: '2023-01-01', type: 'credit', amount: 1, description: '' }] },
          { id: '3', firstName: 'C', lastName: 'C', recentMovements: [{ id: 'm3', date: '2024-01-01', type: 'credit', amount: 1, description: '' }] },
        ] as ClientActivity[],
        expected: ['3', '2', '1'],
      },
    ])('sorts clients by latest movement date (desc) - $title', ({ clients, expected }: { title: string; clients: ClientActivity[]; expected: string[] }) => {
      const result = listClients(clients);
      expect(result.map((c) => c.id)).toEqual(expected);
    });

    it('filters by search term in name', () => {
      const clients: ClientActivity[] = [
        { id: '1', firstName: 'Ada', lastName: 'Lovelace', recentMovements: [] },
        { id: '2', firstName: 'Grace', lastName: 'Hopper', recentMovements: [] },
      ];
      const result = listClients(clients, 'Ada');
      expect(result.length).toBe(1);
      expect(result[0].firstName).toBe('Ada');
    });
  });

  describe('getWeeklyClients', () => {
    it('keeps only clients with recentMovements in the reference week and sorts by latest movement', () => {
      const ref = new Date('2024-02-14'); // week Mon 12 to Sun 18
      const clients: ClientActivity[] = [
        { id: '1', firstName: 'A', lastName: 'A', recentMovements: [{ id: 'm1', date: '2024-02-13', type: 'credit', amount: 1, description: '' }] },
        { id: '2', firstName: 'B', lastName: 'B', recentMovements: [{ id: 'm2', date: '2024-02-10', type: 'credit', amount: 1, description: '' }] },
        { id: '3', firstName: 'C', lastName: 'C', recentMovements: [{ id: 'm3', date: '2024-02-18', type: 'credit', amount: 1, description: '' }] },
      ];
      const result = getWeeklyClients(clients, undefined, ref);
      expect(result.map(c => c.id)).toEqual(['3', '1']);
    });

    it('applies search filtering on top of weekly selection', () => {
      const ref = new Date('2024-02-14');
      const clients: ClientActivity[] = [
        { id: '1', firstName: 'Ada', lastName: 'A', recentMovements: [{ id: 'm1', date: '2024-02-13', type: 'credit', amount: 1, description: '' }] },
        { id: '2', firstName: 'Grace', lastName: 'B', recentMovements: [{ id: 'm2', date: '2024-02-18', type: 'credit', amount: 1, description: '' }] },
      ];
      const result = getWeeklyClients(clients, 'Grace', ref);
      expect(result.length).toBe(1);
      expect(result[0].firstName).toBe('Grace');
    });
  });

  describe('paginateClients', () => {
    it('returns a page slice with totals and page info', () => {
      const clients: ClientActivity[] = [
        { id: '1', firstName: 'A', lastName: 'A', recentMovements: [] },
        { id: '2', firstName: 'B', lastName: 'B', recentMovements: [] },
        { id: '3', firstName: 'C', lastName: 'C', recentMovements: [] },
        { id: '4', firstName: 'D', lastName: 'D', recentMovements: [] },
        { id: '5', firstName: 'E', lastName: 'E', recentMovements: [] },
      ];
      const res1 = paginateClients({ clients, page: 1, pageSize: 2 });
      expect(res1.items.length).toBe(2);
      expect(res1.total).toBe(5);
      expect(res1.totalPages).toBe(3);
      expect(res1.page).toBe(1);

      const res3 = paginateClients({ clients, page: 3, pageSize: 2 });
      expect(res3.items.length).toBe(1);
      expect(res3.page).toBe(3);
    });

    it('clamps invalid page and pageSize', () => {
      const clients: ClientActivity[] = [
        { id: '1', firstName: 'A', lastName: 'A', recentMovements: [] },
      ];
      const res = paginateClients({ clients, page: -1, pageSize: 0 });
      expect(res.page).toBe(1);
      expect(res.pageSize).toBe(1);
      expect(res.totalPages).toBe(1);
    });
  });
});
