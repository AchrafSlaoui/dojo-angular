import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Account } from '@accounts/models/account';
import { AccountsApiService } from '@accounts/services/accounts-api.service';
import { Client } from '@clients/models/client';
import { ClientsApiService } from '@clients/services/clients-api.service';

export interface ClientAccountsView {
  client: Client;
  accounts: Account[];
}

@Injectable({ providedIn: 'root' })
export class ClientAccountsFacade {
  private readonly clientsApi = inject(ClientsApiService);
  private readonly accountsApi = inject(AccountsApiService);

  async getClientAccounts(clientId: string): Promise<ClientAccountsView> {
    const [client, accounts] = await Promise.all([
      firstValueFrom(this.clientsApi.getById(clientId)),
      firstValueFrom(this.accountsApi.getByClientId(clientId)),
    ]);

    return { client, accounts };
  }
}
