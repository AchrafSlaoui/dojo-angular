import { WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { ClientsComponent } from './clients.component';
import { ConfirmService } from '@shared/services/confirm.service';
import { NotificationService } from '@shared/services/notification.service';
import { Client } from '@clients/models/client';
import { ClientActivity } from '@clients/models/client-activity';
import { ClientCardComponent } from '@clients/components/client-card/client-card.component';
import { ClientsApiService } from '@clients/services/clients-api.service';

const mockClients = [
  { id: '1', firstName: 'Ada', lastName: 'Lovelace', email: '', phone: '', address: '', recentMovements: [] },
  { id: '2', firstName: 'Grace', lastName: 'Hopper', email: '', phone: '', address: '', recentMovements: [] },
];

class ClientsApiServiceStub {
  getAll = jest.fn(() => of(mockClients));
  add = jest.fn((payload: Partial<Client>) => of({ id: '3', recentMovements: [], ...payload }));
  update = jest.fn((payload: Partial<Client>) => of({ ...mockClients[0], ...payload }));
  remove = jest.fn(() => of(void 0));
}

type ClientsComponentInternals = ClientsComponent & {
  clientsState: WritableSignal<ClientActivity[]>;
};

describe('ClientsComponent (deep)', () => {
  let fixture: ComponentFixture<ClientsComponent>;
  let api: ClientsApiServiceStub;
  let confirm: { confirm: jest.Mock };
  let notifications: { success: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    api = new ClientsApiServiceStub();
    confirm = { confirm: jest.fn().mockResolvedValue(true) };
    notifications = { success: jest.fn(), error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ClientsComponent],
      providers: [
        { provide: ClientsApiService, useValue: api },
        { provide: ConfirmService, useValue: confirm },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders a ClientCard for each provided client', () => {
    const cards = fixture.debugElement.queryAll(By.directive(ClientCardComponent));
    expect(cards.length).toBe(2);
    expect(cards[0].componentInstance.client().firstName).toBe('Ada');
  });

  it('confirms and forwards client deletion requests', async () => {
    const card = fixture.debugElement.queryAll(By.directive(ClientCardComponent))[0];
    const client = mockClients[0];

    card.triggerEventHandler('deleteRequested', client);

    await fixture.whenStable();

    expect(confirm.confirm).toHaveBeenCalled();
    expect(api.remove).toHaveBeenCalledWith(client.id);
  });

  it('updates the search criteria when the input value changes', () => {
    const input = fixture.debugElement.query(By.css('input[type="text"]'));
    input.triggerEventHandler('ngModelChange', 'Ada');
    fixture.detectChanges();

    expect((fixture.componentInstance as ClientsComponent).search()).toBe('Ada');
  });

  it('sorts clients from the dropdown by total movement amount and resets the page', () => {
    const component = fixture.componentInstance as unknown as ClientsComponentInternals;
    component.clientsState.set([
      {
        id: '1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: '',
        phone: '',
        address: '',
        recentMovements: [{ id: 'm1', date: '2024-02-12', type: 'credit', amount: 10, description: '' }],
      },
      {
        id: '2',
        firstName: 'Grace',
        lastName: 'Hopper',
        email: '',
        phone: '',
        address: '',
        recentMovements: [{ id: 'm2', date: '2024-02-10', type: 'debit', amount: 200, description: '' }],
      },
    ]);
    component.page.set(2);

    const select = fixture.debugElement.query(By.css('select[aria-label="Trier les clients"]'));
    select.triggerEventHandler('ngModelChange', 'totalMovementsDesc');
    fixture.detectChanges();

    expect(component.sort()).toBe('totalMovementsDesc');
    expect(component.page()).toBe(1);
    expect(component.clients().map((client) => client.id)).toEqual(['2', '1']);
  });

  it('starts and cancels client creation with a fresh draft', () => {
    const component = fixture.componentInstance;

    component.newClient = { firstName: 'Old', lastName: 'Value', email: 'old@example.com', phone: '1', address: 'Paris' };
    component.startAdd();

    // EXERCICE 1
    expect(component.adding).toBe(true);
    expect(component.newClient).toEqual({ firstName: '', lastName: '', email: '', phone: '', address: '' });

    component.cancelAdd();

    // EXERCICE 1
    expect(component.adding).toBe(false);
  });

  it('ignores client creation when required names are missing', async () => {
    const component = fixture.componentInstance;
    component.newClient = { firstName: ' ', lastName: 'Hopper', email: '', phone: '', address: '' };

    await component.saveAdd();

    expect(api.add).not.toHaveBeenCalled();
    expect(notifications.success).not.toHaveBeenCalled();
  });

  it('creates a client, prepends it to the list and notifies success', async () => {
    const component = fixture.componentInstance;
    component.page.set(2);
    component.newClient = {
      firstName: '  Alan ',
      lastName: ' Turing ',
      email: 'alan@example.com',
      phone: '0600000000',
      address: 'Manchester',
    };

    await component.saveAdd();

    expect(api.add).toHaveBeenCalledWith({
      firstName: 'Alan',
      lastName: 'Turing',
      email: 'alan@example.com',
      phone: '0600000000',
      address: 'Manchester',
    });
    expect(component.clients()[0]).toMatchObject({ id: '3', firstName: 'Alan', lastName: 'Turing' });
    expect(component.page()).toBe(1);
    // EXERCICE 1
    expect(component.adding).toBe(false);
    expect(notifications.success).toHaveBeenCalledWith('Client Alan Turing cree.');
  });

  it('shows an error notification when client creation fails', async () => {
    const component = fixture.componentInstance;
    api.add.mockReturnValueOnce(throwError(() => new Error('boom')));
    component.newClient = { firstName: 'Alan', lastName: 'Turing', email: '', phone: '', address: '' };

    await component.saveAdd();

    expect(notifications.error).toHaveBeenCalledWith("Impossible d'ajouter le client.");
    expect(component.mutating()).toBe(false);
  });

  it('updates a client and keeps its recent movements', async () => {
    const component = fixture.componentInstance;

    await component.onSaveClient({ id: '1', firstName: 'Ada', lastName: 'Byron', email: 'ada@new.test' });

    expect(api.update).toHaveBeenCalledWith({ id: '1', firstName: 'Ada', lastName: 'Byron', email: 'ada@new.test' });
    expect(component.clients()[0]).toMatchObject({ id: '1', lastName: 'Byron', recentMovements: [] });
    expect(notifications.success).toHaveBeenCalledWith('Client mis a jour.');
  });

  it('shows an error notification when client update fails', async () => {
    api.update.mockReturnValueOnce(throwError(() => new Error('boom')));

    await fixture.componentInstance.onSaveClient({ id: '1', firstName: 'Ada', lastName: 'Byron' });

    expect(notifications.error).toHaveBeenCalledWith('La mise a jour du client a echoue.');
    expect(fixture.componentInstance.mutating()).toBe(false);
  });

  it('does not delete a client when confirmation is rejected', async () => {
    confirm.confirm.mockResolvedValueOnce(false);

    await fixture.componentInstance.deleteClient(mockClients[0]);

    expect(api.remove).not.toHaveBeenCalled();
  });

  it('shows an error notification when client deletion fails', async () => {
    api.remove.mockReturnValueOnce(throwError(() => new Error('boom')));

    await fixture.componentInstance.deleteClient(mockClients[0]);

    expect(notifications.error).toHaveBeenCalledWith('La suppression du client a echoue.');
    expect(fixture.componentInstance.mutating()).toBe(false);
  });

  it('tracks clients by identifier', () => {
    expect(fixture.componentInstance.trackByClientId(0, mockClients[0])).toBe('1');
  });

  it('moves through pages within valid bounds and resets the page size', () => {
    const component = fixture.componentInstance;
    component.pageSize.set(1);

    component.nextPage();
    expect(component.page()).toBe(2);

    component.nextPage();
    expect(component.page()).toBe(2);

    component.previousPage();
    expect(component.page()).toBe(1);

    component.previousPage();
    expect(component.page()).toBe(1);

    component.onPageSizeChange('10.8');
    expect(component.pageSize()).toBe(10);
    expect(component.page()).toBe(1);
  });

  it('ignores invalid page size values', () => {
    const component = fixture.componentInstance;
    component.pageSize.set(20);

    component.onPageSizeChange('abc');

    expect(component.pageSize()).toBe(20);
  });

  it('loads an empty list and exposes an error when the API fails', async () => {
    TestBed.resetTestingModule();
    const failingApi = new ClientsApiServiceStub();
    failingApi.getAll.mockReturnValueOnce(throwError(() => new Error('Load failed')));

    await TestBed.configureTestingModule({
      imports: [ClientsComponent],
      providers: [
        { provide: ClientsApiService, useValue: failingApi },
        { provide: ConfirmService, useValue: confirm },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    const failedFixture = TestBed.createComponent(ClientsComponent);
    failedFixture.detectChanges();
    await failedFixture.whenStable();

    expect(failedFixture.componentInstance.clients()).toEqual([]);
    expect(failedFixture.componentInstance.error()).toBe('Load failed');
    expect(failedFixture.componentInstance.loading()).toBe(false);
  });
});
