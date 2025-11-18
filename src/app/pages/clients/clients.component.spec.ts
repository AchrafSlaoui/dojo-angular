import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ClientsComponent } from './clients.component';
import { ClientsStore } from '@app/stores/clients.store';
import { ConfirmService } from '@shared/services/confirm.service';
import { NotificationService } from '@shared/services/notification.service';
import { Client } from '@app/models/client';
import { ClientCardComponent } from '@app/components/client-card/client-card.component';

class ClientsStoreStub {
  private readonly list = signal<Client[]>([
    {
      id: '1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: '',
      phone: '',
      address: '',
      movements: [],
    },
    {
      id: '2',
      firstName: 'Grace',
      lastName: 'Hopper',
      email: '',
      phone: '',
      address: '',
      movements: [],
    },
  ]);

  paginatedClients = this.list;
  filteredClients = this.list;
  weeklyFilteredClients = signal<Client[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  mutating = signal(false);
  totalClients = signal(2);
  totalPages = signal(1);
  page = signal(1);
  pageSize = signal(10);
  search = signal('');

  refresh = jest.fn(() => of([] as Client[]));
  setSearch = jest.fn();
  addClient = jest.fn(() => of({ id: '9' } as unknown as Client));
  updateClient = jest.fn(() => of({} as unknown as Client));
  deleteClient = jest.fn(() => of(void 0));
  nextPage = jest.fn();
  previousPage = jest.fn();
  setPageSize = jest.fn();
}

describe('ClientsComponent (deep)', () => {
  let fixture: ComponentFixture<ClientsComponent>;
  let store: ClientsStoreStub;
  let confirm: { confirm: jest.Mock };
  let notifications: { success: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    store = new ClientsStoreStub();
    confirm = { confirm: jest.fn().mockResolvedValue(true) };
    notifications = { success: jest.fn(), error: jest.fn() };

    TestBed.configureTestingModule({
      imports: [ClientsComponent],
      providers: [
        { provide: ClientsStore, useValue: store },
        { provide: ConfirmService, useValue: confirm },
        { provide: NotificationService, useValue: notifications },
      ],
    });

    fixture = TestBed.createComponent(ClientsComponent);
    fixture.detectChanges();
  });

  it('renders a ClientCard for each provided client', () => {
    // Given the facade exposes two clients
    // When the rendered ClientCard components are inspected
    const cards = fixture.debugElement.queryAll(By.directive(ClientCardComponent));
    expect(cards.length).toBe(2);
    // Then the first card contains the expected client data
    expect(cards[0].componentInstance.client().firstName).toBe('Ada');
  });

  it('confirms and forwards client deletion requests', async () => {
    // Given a client card emits a delete request
    const card = fixture.debugElement.queryAll(By.directive(ClientCardComponent))[0];
    const client = store.paginatedClients()[0];

    // When the deletion event is raised and processed
    card.triggerEventHandler('deleteRequested', client);

    await fixture.whenStable();

    // Then the confirmation is requested before the facade deletion
    expect(confirm.confirm).toHaveBeenCalled();
    expect(store.deleteClient).toHaveBeenCalledWith(client.id);
  });

  it('updates the search criteria when the input value changes', () => {
    // Given the search input element
    const input = fixture.debugElement.query(By.css('input[type="text"]'));
    // When the user updates the search text
    input.triggerEventHandler('ngModelChange', 'Ada');

    // Then the facade receives the new search query
    expect(store.setSearch).toHaveBeenCalledWith('Ada');
  });
});
