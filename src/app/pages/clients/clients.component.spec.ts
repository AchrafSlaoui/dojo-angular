import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { ClientsComponent } from './clients.component';
import { ConfirmService } from '@shared/services/confirm.service';
import { NotificationService } from '@shared/services/notification.service';
import { Client } from '@app/models/client';
import { ClientCardComponent } from '@app/components/client-card/client-card.component';
import { ClientsApiService } from '@app/services/clients-api.service';

const mockClients: Client[] = [
  { id: '1', firstName: 'Ada', lastName: 'Lovelace', email: '', phone: '', address: '', movements: [] },
  { id: '2', firstName: 'Grace', lastName: 'Hopper', email: '', phone: '', address: '', movements: [] },
];

class ClientsApiServiceStub {
  getAll = jest.fn(() => of(mockClients));
  add = jest.fn((payload: Partial<Client>) => of({ id: '3', movements: [], ...payload } as Client));
  update = jest.fn((payload: Partial<Client>) => of({ ...(mockClients[0] as Client), ...payload } as Client));
  remove = jest.fn(() => of(void 0));
}

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
});
