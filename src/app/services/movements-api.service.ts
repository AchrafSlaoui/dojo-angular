import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movement } from '@app/models/movement';

@Injectable({ providedIn: 'root' })
export class MovementsApiService {
  constructor(private http: HttpClient) {}

  create(clientId: string, movement: Omit<Movement, 'id'>): Observable<Movement> {
    return this.http.post<Movement>(`/api/clients/${clientId}/movements`, movement);
  }

  update(clientId: string, movement: Movement): Observable<Movement> {
    return this.http.put<Movement>(`/api/clients/${clientId}/movements/${movement.id}`, movement);
  }

  remove(clientId: string, movementId: string): Observable<void> {
    return this.http.delete<void>(`/api/clients/${clientId}/movements/${movementId}`);
  }
}

