import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { ClientsComponent } from './clients.component';
import { ConfirmService } from '@shared/services/confirm.service';
import { NotificationService } from '@shared/services/notification.service';
import { Client } from '@clients/models/client';
import { ClientCardComponent } from '@clients/components/client-card/client-card.component';
import { ClientsApiService } from '@clients/services/clients-api.service';

const mockClients: Client[] = [
  { id: '1', firstName: 'Ada', lastName: 'Lovelace', email: '', phone: '', address: '', recentMovements: [] },
  { id: '2', firstName: 'Grace', lastName: 'Hopper', email: '', phone: '', address: '', recentMovements: [] },
];

class ClientsApiServiceStub {
  getAll = jest.fn(() => of(mockClients));
  add = jest.fn((payload: Partial<Client>) => of({ id: '3', recentMovements: [], ...payload } as Client));
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

  it('clamps the current page when the result set becomes smaller', () => {
    const component = fixture.componentInstance;

    component.onPageSizeChange('1');
    component.nextPage();
    component.setSearch('Ada');
    fixture.detectChanges();

    expect(component.page()).toBe(1);
  });
});
