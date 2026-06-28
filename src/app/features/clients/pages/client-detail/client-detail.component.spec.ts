import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Account } from '@accounts/models/account';
import { AccountsApiService } from '@accounts/services/accounts-api.service';
import { AccountsComponent } from '@accounts/pages/accounts/accounts.component';
import { Client } from '@clients/models/client';
import { ClientsApiService } from '@clients/services/clients-api.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { NotificationService } from '@shared/services/notification.service';
import { ClientDetailComponent } from './client-detail.component';

const clientId = 'c42';

const client: Client = {
  id: clientId,
  firstName: 'Ada',
  lastName: 'Lovelace',
  photoUrl: 'https://example.com/ada.jpg',
};

const accounts: Account[] = [
  {
    id: 'a1',
    clientId,
    label: 'Compte courant Ada',
    type: 'checking',
    status: 'active',
    balance: 120,
    currency: 'EUR',
    movements: [],
  },
  {
    id: 'a2',
    clientId,
    label: 'Livret Ada',
    type: 'saving',
    status: 'active',
    balance: 250,
    currency: 'EUR',
    movements: [],
  },
];

describe('ClientDetailComponent', () => {
  let fixture: ComponentFixture<ClientDetailComponent>;
  let clientsApi: { getById: jest.Mock };
  let accountsApi: { getByClientId: jest.Mock; add: jest.Mock; update: jest.Mock; remove: jest.Mock };
  let confirm: { confirm: jest.Mock };
  let notifications: { success: jest.Mock; error: jest.Mock };

  async function settleView(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function embeddedAccounts(): AccountsComponent {
    return fixture.debugElement.query(By.directive(AccountsComponent)).componentInstance as AccountsComponent;
  }

  beforeEach(async () => {
    clientsApi = { getById: jest.fn(() => of(client)) };
    accountsApi = {
      getByClientId: jest.fn(() => of(accounts)),
      add: jest.fn((_clientId, account) =>
        of({ id: 'a3', clientId, balance: 0, currency: 'EUR', movements: [], ...account })
      ),
      update: jest.fn((_clientId, account) => of({ ...accounts[0], ...account })),
      remove: jest.fn(() => of(undefined)),
    };
    confirm = { confirm: jest.fn(() => Promise.resolve(true)) };
    notifications = { success: jest.fn(), error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ClientDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: clientId })),
            queryParamMap: of(convertToParamMap({})),
          },
        },
        { provide: ClientsApiService, useValue: clientsApi },
        { provide: AccountsApiService, useValue: accountsApi },
        { provide: ConfirmService, useValue: confirm },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientDetailComponent);
    await settleView();
  });

  it('loads the client and delegates account loading to AccountsComponent', () => {
    expect(fixture.componentInstance.clientId()).toBe(clientId);
    expect(clientsApi.getById).toHaveBeenCalledWith(clientId);
    expect(accountsApi.getByClientId).toHaveBeenCalledWith(clientId);
    expect(fixture.componentInstance.client()).toEqual(client);
    expect(embeddedAccounts().accounts()).toEqual(accounts);
  });

  it('renders accounts through the embedded AccountsComponent', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Compte courant Ada');
    expect(text).toContain('Livret Ada');
  });

  it('falls back to client initials when the summary photo cannot be loaded', () => {
    const image = fixture.debugElement.query(By.css('.avatar img'));
    image.triggerEventHandler('error');
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.avatar img'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.avatar span')).nativeElement.textContent).toContain('AL');
  });

  it('renders account CRUD actions from the embedded component', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[aria-label="Ajouter un compte"]')).not.toBeNull();
    expect(element.querySelectorAll('[aria-label="Modifier le compte"]').length).toBe(2);
    expect(element.querySelectorAll('[aria-label="Supprimer le compte"]').length).toBe(2);
  });

  it('filters accounts through the embedded component', () => {
    const component = embeddedAccounts();
    component.setSearch('livret');
    component.setTypeFilter('saving');

    expect(component.accounts().map((account) => account.id)).toEqual(['a2']);
  });

  it('adds an account through the embedded component', async () => {
    const component = embeddedAccounts();
    component.newAccount = { label: 'Compte secondaire', type: 'joint', status: 'active' };

    await component.saveAdd();

    expect(accountsApi.add).toHaveBeenCalledWith(clientId, {
      label: 'Compte secondaire',
      type: 'joint',
      status: 'active',
    });
  });

  it('deletes an account through the embedded component', async () => {
    await embeddedAccounts().deleteAccount(accounts[0]);

    expect(confirm.confirm).toHaveBeenCalled();
    expect(accountsApi.remove).toHaveBeenCalledWith(clientId, 'a1');
  });
});
