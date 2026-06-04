import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ClientDetailComponent } from './client-detail.component';
import { Account } from '@accounts/models/account';
import { AccountsApiService } from '@accounts/services/accounts-api.service';
import { Client } from '@clients/models/client';
import { ClientAccountsFacade } from '@clients/services/client-accounts.facade';
import { ConfirmService } from '@shared/services/confirm.service';
import { NotificationService } from '@shared/services/notification.service';

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

class ActivatedRouteStub {
  readonly paramMap = of(convertToParamMap({ id: clientId }));
}

class ClientAccountsFacadeStub {
  getClientAccounts = jest.fn(() => Promise.resolve({ client, accounts }));
}

describe('ClientDetailComponent', () => {
  let fixture: ComponentFixture<ClientDetailComponent>;
  let component: ClientDetailComponent;
  let facade: ClientAccountsFacadeStub;
  let accountsApi: { add: jest.Mock; update: jest.Mock; remove: jest.Mock };
  let confirm: { confirm: jest.Mock };
  let notifications: { success: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    facade = new ClientAccountsFacadeStub();
    accountsApi = {
      add: jest.fn((_clientId, account) => of({ id: 'a3', clientId, balance: 0, currency: 'EUR', movements: [], ...account })),
      update: jest.fn((_clientId, account) => of({ ...accounts[0], ...account })),
      remove: jest.fn(() => of(undefined)),
    };
    confirm = { confirm: jest.fn(() => Promise.resolve(true)) };
    notifications = { success: jest.fn(), error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ClientDetailComponent],
      providers: [
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
        { provide: ClientAccountsFacade, useValue: facade },
        { provide: AccountsApiService, useValue: accountsApi },
        { provide: ConfirmService, useValue: confirm },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads the client and its accounts from the route identifier', () => {
    expect(component.clientId()).toBe(clientId);
    expect(facade.getClientAccounts).toHaveBeenCalledWith(clientId);
    expect(component.client()).toEqual(client);
    expect(component.accounts()).toEqual(accounts);
  });

  it('computes the balance from the client accounts', () => {
    expect(component.clientBalance()).toBe(370);
  });

  it('renders accounts directly on the client detail page', () => {
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

  it('renders account CRUD actions on the client detail page', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[aria-label="Ajouter un compte"]')).not.toBeNull();
    expect(element.querySelectorAll('[aria-label="Modifier le compte"]').length).toBe(2);
    expect(element.querySelectorAll('[aria-label="Supprimer le compte"]').length).toBe(2);
  });

  it('filters accounts by label and type', () => {
    component.setAccountSearch('livret');
    component.setAccountTypeFilter('saving');

    expect(component.filteredAccounts().map((account) => account.id)).toEqual(['a2']);
  });

  it('adds an account from the client detail page', async () => {
    component.newAccount = { label: 'Compte secondaire', type: 'joint', status: 'active' };

    await component.saveAddAccount();
    fixture.detectChanges();

    expect(accountsApi.add).toHaveBeenCalledWith(clientId, {
      label: 'Compte secondaire',
      type: 'joint',
      status: 'active',
    });
    expect(component.accounts()[0].label).toBe('Compte secondaire');
  });

  it('deletes an account from the client detail page', async () => {
    await component.deleteAccount(accounts[0]);
    fixture.detectChanges();

    expect(confirm.confirm).toHaveBeenCalled();
    expect(accountsApi.remove).toHaveBeenCalledWith(clientId, 'a1');
    expect(component.accounts().some((account) => account.id === 'a1')).toBe(false);
  });
});
