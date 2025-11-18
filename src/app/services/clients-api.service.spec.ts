import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ClientsApiService } from './clients-api.service';
import { Client } from '@app/models/client';

describe('ClientsApiService', () => {
  let api: ClientsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClientsApiService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(ClientsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('GET /api/clients returns the collection', () => {
    const expected: Client[] = [];
    api.getAll().subscribe((list) => expect(list).toEqual(expected));
    const req = httpMock.expectOne('/api/clients');
    expect(req.request.method).toBe('GET');
    req.flush(expected);
  });

  it('GET /api/clients/:id returns a client', () => {
    const payload = { id: '1' } as Client;
    api.getById('1').subscribe((client) => expect(client).toEqual(payload));
    const req = httpMock.expectOne('/api/clients/1');
    expect(req.request.method).toBe('GET');
    req.flush(payload);
  });

  it('POST /api/clients creates a client', () => {
    const input = { firstName: 'Ada', lastName: 'Lovelace', email: '', phone: '', address: '' };
    const created = { id: '42', ...input } as Client;
    api.add(input).subscribe((result) => expect(result).toEqual(created));
    const req = httpMock.expectOne('/api/clients');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(created);
  });

  it('PUT /api/clients/:id updates a client', () => {
    const update = { id: '42', firstName: 'Ada' } as any;
    const updated = { id: '42', firstName: 'Ada', lastName: 'Lovelace' } as Client;
    api.update(update).subscribe((result) => expect(result).toEqual(updated));
    const req = httpMock.expectOne('/api/clients/42');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ firstName: 'Ada' });
    req.flush(updated);
  });

  it('DELETE /api/clients/:id removes a client', () => {
    api.remove('9').subscribe((result) => expect(result).toBeUndefined());
    const req = httpMock.expectOne('/api/clients/9');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});

