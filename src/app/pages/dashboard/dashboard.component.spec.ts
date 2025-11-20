import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { Client } from '@app/models/client';
import { ClientsApiService } from '@app/services/clients-api.service';
import { of, throwError } from 'rxjs';

const today = new Date().toISOString().slice(0, 10);
const mockClients: Client[] = [
  { id: '1', firstName: 'Ada', lastName: 'Lovelace', movements: [{ id: 'm1', date: today, type: 'credit', amount: 10, description: '' }] },
  { id: '2', firstName: 'Grace', lastName: 'Hopper', movements: [{ id: 'm2', date: today, type: 'debit', amount: 5, description: '' }] },
];

class ClientsApiServiceStub {
  getAll = jest.fn(() => of(mockClients));
}

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let api: ClientsApiServiceStub;

  beforeEach(async () => {
    api = new ClientsApiServiceStub();

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: ClientsApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads and exposes weekly clients from the API', () => {
    expect(component.weeklyClients()).toEqual(mockClients);
  });

  it('surfaces loading and error state', async () => {
    api.getAll.mockReturnValueOnce(throwError(() => new Error('oops')));
    (component as any)['loadClients']();
    await fixture.whenStable();
    expect(component.error()).toBe('oops');
  });

  it('returns the client id from trackByClientId', () => {
    const client = mockClients[0];
    expect(component.trackByClientId(0, client)).toBe(client.id);
  });
});
