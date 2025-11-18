import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '@app/models/client';
import { ClientUpdate } from '@clients/types/client.types';

@Injectable({ providedIn: 'root' })
export class ClientsApiService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>('/api/clients');
  }

  getById(id: string): Observable<Client> {
    return this.http.get<Client>(`/api/clients/${id}`);
  }

  add(client: Omit<Client, 'id' | 'movements'>): Observable<Client> {
    const payload = { ...client } as Record<string, unknown>;
    return this.http.post<Client>('/api/clients', payload);
  }

  update(update: ClientUpdate): Observable<Client> {
    const { id, ...rest } = update;
    return this.http.put<Client>(`/api/clients/${id}`, rest);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/clients/${id}`);
  }
}

