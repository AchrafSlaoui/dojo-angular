import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account, AccountCreate, AccountUpdate, MovementCreate } from '@accounts/models/account';
import { Movement } from '@accounts/models/movement';

@Injectable({ providedIn: 'root' })
export class AccountsApiService {
  constructor(private http: HttpClient) {}

  getByClientId(clientId: string): Observable<Account[]> {
    return this.http.get<Account[]>(`/api/clients/${clientId}/accounts`);
  }

  getById(clientId: string, accountId: string): Observable<Account> {
    return this.http.get<Account>(`/api/clients/${clientId}/accounts/${accountId}`);
  }

  add(clientId: string, account: AccountCreate): Observable<Account> {
    return this.http.post<Account>(`/api/clients/${clientId}/accounts`, account);
  }

  update(clientId: string, account: AccountUpdate): Observable<Account> {
    return this.http.put<Account>(`/api/clients/${clientId}/accounts/${account.id}`, account);
  }

  remove(clientId: string, accountId: string): Observable<void> {
    return this.http.delete<void>(`/api/clients/${clientId}/accounts/${accountId}`);
  }

  addMovement(clientId: string, accountId: string, movement: MovementCreate): Observable<Account> {
    return this.http.post<Account>(`/api/clients/${clientId}/accounts/${accountId}/movements`, movement);
  }

  updateMovement(clientId: string, accountId: string, movement: Movement): Observable<Account> {
    return this.http.put<Account>(
      `/api/clients/${clientId}/accounts/${accountId}/movements/${movement.id}`,
      movement
    );
  }

  removeMovement(clientId: string, accountId: string, movementId: string): Observable<Account> {
    return this.http.delete<Account>(`/api/clients/${clientId}/accounts/${accountId}/movements/${movementId}`);
  }
}
