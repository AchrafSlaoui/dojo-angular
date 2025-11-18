import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MovementsApiService } from './movements-api.service';
import { Movement } from '@app/models/movement';

describe('MovementsApiService', () => {
  let api: MovementsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MovementsApiService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(MovementsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('POST /api/clients/:id/movements creates a movement', () => {
    const clientId = 'c1';
    const input = { date: '2024-02-10', type: 'credit', amount: 100, description: 'Vente' } as Omit<Movement, 'id'>;
    const created = { ...input, id: 'm1' } as Movement;
    api.create(clientId, input).subscribe((result) => expect(result).toEqual(created));
    const req = httpMock.expectOne(`/api/clients/${clientId}/movements`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(created);
  });

  it('PUT /api/clients/:id/movements/:mid updates a movement', () => {
    const clientId = 'c1';
    const movement = { id: 'm1', date: '2024-02-11', type: 'debit', amount: 50, description: 'Courses' } as Movement;
    api.update(clientId, movement).subscribe((result) => expect(result).toEqual(movement));
    const req = httpMock.expectOne(`/api/clients/${clientId}/movements/${movement.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(movement);
    req.flush(movement);
  });

  it('DELETE /api/clients/:id/movements/:mid removes a movement', () => {
    const clientId = 'c1';
    api.remove(clientId, 'm9').subscribe((result) => expect(result).toBeUndefined());
    const req = httpMock.expectOne(`/api/clients/${clientId}/movements/m9`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});

