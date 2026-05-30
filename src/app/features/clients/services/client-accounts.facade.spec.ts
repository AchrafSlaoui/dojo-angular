import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Account } from '@accounts/models/account';
import { AccountsApiService } from '@accounts/services/accounts-api.service';
import { Client } from '@clients/models/client';
import { ClientsApiService } from '@clients/services/clients-api.service';
import { ClientAccountsFacade } from './client-accounts.facade';

describe('ClientAccountsFacade', () => {
  it('loads the client and accounts together', async () => {
    const client: Client = { id: 'c1', firstName: 'Ada', lastName: 'Lovelace' };
    const accounts: Account[] = [
      {
        id: 'a1',
        clientId: 'c1',
        label: 'Compte courant',
        type: 'checking',
        status: 'active',
        balance: 100,
        currency: 'EUR',
        movements: [],
      },
    ];
    const clientsApi = { getById: jest.fn(() => of(client)) };
    const accountsApi = { getByClientId: jest.fn(() => of(accounts)) };

    TestBed.configureTestingModule({
      providers: [
        ClientAccountsFacade,
        { provide: ClientsApiService, useValue: clientsApi },
        { provide: AccountsApiService, useValue: accountsApi },
      ],
    });

    const facade = TestBed.inject(ClientAccountsFacade);

    await expect(facade.getClientAccounts('c1')).resolves.toEqual({ client, accounts });
    expect(clientsApi.getById).toHaveBeenCalledWith('c1');
    expect(accountsApi.getByClientId).toHaveBeenCalledWith('c1');
  });
});
