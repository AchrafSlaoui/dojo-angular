import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { lastValueFrom, of } from 'rxjs';
import { Account } from '@accounts/models/account';
import { ClientActivity } from '@clients/models/client-activity';
import { mockApiInterceptor, resetMockApiStateForTests } from './mock-api.interceptor';

describe('mockApiInterceptor accounts domain', () => {
  const next: HttpHandlerFn = jest.fn(() => of(new HttpResponse({ status: 599 })));

  async function send<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: unknown): Promise<HttpResponse<T>> {
    const request = body === undefined
      ? new HttpRequest(method as 'GET', url)
      : new HttpRequest(method as 'POST', url, body);
    return lastValueFrom(mockApiInterceptor(request, next)) as Promise<HttpResponse<T>>;
  }

  beforeEach(() => {
    localStorage.clear();
    resetMockApiStateForTests();
    jest.clearAllMocks();
  });

  it('creates an account and keeps it persisted for the client', async () => {
    const response = await send<Account>('POST', '/api/clients/c1/accounts', {
      label: 'Compte test',
      type: 'checking',
      status: 'active',
    });

    expect(response.status).toBe(201);
    expect(response.body?.label).toBe('Compte test');
    expect(response.body?.balance).toBe(0);

    const accounts = await send<Account[]>('GET', '/api/clients/c1/accounts');
    expect(accounts.body?.some((account) => account.id === response.body?.id)).toBe(true);
  });

  it('adds a positive movement and recalculates the account balance', async () => {
    const createdAccount = await send<Account>('POST', '/api/clients/c1/accounts', {
      label: 'Compte mouvements',
      type: 'checking',
      status: 'active',
    });

    const updatedAccount = await send<Account>(
      'POST',
      `/api/clients/c1/accounts/${createdAccount.body?.id}/movements`,
      { date: '2024-01-10', type: 'credit', amount: 75, description: 'Depot' }
    );

    expect(updatedAccount.status).toBe(201);
    expect(updatedAccount.body?.balance).toBe(75);
    expect(updatedAccount.body?.movements).toHaveLength(1);
  });

  it('rejects non-positive movement amounts', async () => {
    const createdAccount = await send<Account>('POST', '/api/clients/c1/accounts', {
      label: 'Compte controle',
      type: 'checking',
      status: 'active',
    });

    const response = await send<Account>(
      'POST',
      `/api/clients/c1/accounts/${createdAccount.body?.id}/movements`,
      { date: '2024-01-10', type: 'credit', amount: 0, description: 'Invalide' }
    );

    expect(response.status).toBe(400);

    const account = await send<Account>('GET', `/api/clients/c1/accounts/${createdAccount.body?.id}`);
    expect(account.body?.movements).toEqual([]);
    expect(account.body?.balance).toBe(0);
  });

  it('removes account movements from the client activity when the account is deleted', async () => {
    const createdAccount = await send<Account>('POST', '/api/clients/c1/accounts', {
      label: 'Compte temporaire',
      type: 'checking',
      status: 'active',
    });
    const accountId = createdAccount.body?.id ?? '';

    const accountWithMovement = await send<Account>(
      'POST',
      `/api/clients/c1/accounts/${accountId}/movements`,
      { date: '2024-01-10', type: 'credit', amount: 75, description: 'Depot temporaire' }
    );
    const movementId = accountWithMovement.body?.movements[0]?.id;

    const deleteResponse = await send<void>('DELETE', `/api/clients/c1/accounts/${accountId}`);
    expect(deleteResponse.status).toBe(204);

    const clients = await send<ClientActivity[]>('GET', '/api/clients');
    const client = clients.body?.find((item) => item.id === 'c1');
    expect(client?.recentMovements.some((movement) => movement.id === movementId)).toBe(false);
  });
});
