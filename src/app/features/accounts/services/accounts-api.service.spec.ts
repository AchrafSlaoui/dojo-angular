import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AccountsApiService } from './accounts-api.service';
import { Account } from '@accounts/models/account';
import { Movement } from '@accounts/models/movement';

describe('AccountsApiService', () => {
  let service: AccountsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AccountsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads accounts for a client', () => {
    const accounts: Account[] = [
      { id: 'a1', clientId: 'c1', label: 'Compte courant', type: 'checking', status: 'active', balance: 120, currency: 'EUR', movements: [] },
    ];

    service.getByClientId('c1').subscribe((result) => {
      expect(result).toEqual(accounts);
    });

    const req = http.expectOne('/api/clients/c1/accounts');
    expect(req.request.method).toBe('GET');
    req.flush(accounts);
  });

  it('loads one account for a client', () => {
    const account: Account = {
      id: 'a1',
      clientId: 'c1',
      label: 'Compte courant',
      type: 'checking',
      status: 'active',
      balance: 120,
      currency: 'EUR',
      movements: [],
    };

    service.getById('c1', 'a1').subscribe((result) => {
      expect(result).toEqual(account);
    });

    const req = http.expectOne('/api/clients/c1/accounts/a1');
    expect(req.request.method).toBe('GET');
    req.flush(account);
  });

  it('creates an account for a client', () => {
    const input = { label: 'Livret', type: 'saving', status: 'active' } as const;
    const created: Account = {
      id: 'a2',
      clientId: 'c1',
      label: 'Livret',
      type: 'saving',
      status: 'active',
      balance: 0,
      currency: 'EUR',
      movements: [],
    };

    service.add('c1', input).subscribe((result) => {
      expect(result).toEqual(created);
    });

    const req = http.expectOne('/api/clients/c1/accounts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(created);
  });

  it('updates an account for a client', () => {
    const update = { id: 'a1', label: 'Compte principal' };
    const updated: Account = {
      id: 'a1',
      clientId: 'c1',
      label: 'Compte principal',
      type: 'checking',
      status: 'active',
      balance: 120,
      currency: 'EUR',
      movements: [],
    };

    service.update('c1', update).subscribe((result) => {
      expect(result).toEqual(updated);
    });

    const req = http.expectOne('/api/clients/c1/accounts/a1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(update);
    req.flush(updated);
  });

  it('removes an account for a client', () => {
    service.remove('c1', 'a1').subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const req = http.expectOne('/api/clients/c1/accounts/a1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('adds a movement on one account', () => {
    const movement = {
      date: '2024-01-10',
      type: 'credit',
      amount: 150,
      description: 'Salaire',
    } as const;
    const account: Account = {
      id: 'a1',
      clientId: 'c1',
      label: 'Compte courant',
      type: 'checking',
      status: 'active',
      balance: 150,
      currency: 'EUR',
      movements: [{ id: 'm1', ...movement }],
    };

    service.addMovement('c1', 'a1', movement).subscribe((result) => {
      expect(result).toEqual(account);
    });

    const req = http.expectOne('/api/clients/c1/accounts/a1/movements');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(movement);
    req.flush(account);
  });

  it('updates a movement on one account', () => {
    const movement: Movement = {
      id: 'm1',
      date: '2024-01-10',
      type: 'credit',
      amount: 150,
      description: 'Salaire ajuste',
    };
    const account: Account = {
      id: 'a1',
      clientId: 'c1',
      label: 'Compte courant',
      type: 'checking',
      status: 'active',
      balance: 150,
      currency: 'EUR',
      movements: [movement],
    };

    service.updateMovement('c1', 'a1', movement).subscribe((result) => {
      expect(result).toEqual(account);
    });

    const req = http.expectOne('/api/clients/c1/accounts/a1/movements/m1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(movement);
    req.flush(account);
  });

  it('removes a movement from one account', () => {
    const account: Account = {
      id: 'a1',
      clientId: 'c1',
      label: 'Compte courant',
      type: 'checking',
      status: 'active',
      balance: 0,
      currency: 'EUR',
      movements: [],
    };

    service.removeMovement('c1', 'a1', 'm1').subscribe((result) => {
      expect(result).toEqual(account);
    });

    const req = http.expectOne('/api/clients/c1/accounts/a1/movements/m1');
    expect(req.request.method).toBe('DELETE');
    req.flush(account);
  });
});
