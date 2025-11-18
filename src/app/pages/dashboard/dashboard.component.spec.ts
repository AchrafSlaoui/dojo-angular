import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { DashboardComponent } from './dashboard.component';
import { ClientsStore } from '@app/stores/clients.store';
import { Client } from '@app/models/client';

const mockClients: Client[] = [
  { id: '1', firstName: 'Ada', lastName: 'Lovelace', movements: [] },
  { id: '2', firstName: 'Grace', lastName: 'Hopper', movements: [] },
];

class ClientsStoreStub {
  weeklyFilteredClients: WritableSignal<Client[]>;
  loading = signal(false);
  error = signal<string | null>(null);
  search: WritableSignal<string>;
  setSearch = jest.fn();

  constructor(clients: Client[]) {
    this.weeklyFilteredClients = signal(clients);
    this.search = signal('');
  }
}

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let storeStub: ClientsStoreStub;

  beforeEach(() => {
    storeStub = new ClientsStoreStub(mockClients);

    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: ClientsStore, useValue: storeStub }],
    });

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('reflects the weekly clients provided by the facade', () => {
    // Given the facade supplies weekly filtered clients
    expect(component.weeklyClients()).toEqual(mockClients);
    // When the facade updates the list
    storeStub.weeklyFilteredClients.set([mockClients[0]]);
    // Then the component exposes the new list
    expect(component.weeklyClients()).toEqual([mockClients[0]]);
  });

  it('reads loading and error state directly from the facade', () => {
    // Given the initial facade state
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();

    // When the facade updates loading and error flags
    storeStub.loading.set(true);
    storeStub.error.set('oops');

    // Then the component exposes the updated flags
    expect(component.loading()).toBe(true);
    expect(component.error()).toBe('oops');
  });

  it('returns the client id from trackByClientId', () => {
    // Given a client entry
    const client = mockClients[0];
    // When trackByClientId is invoked
    expect(component.trackByClientId(0, client)).toBe(client.id);
  });
});
