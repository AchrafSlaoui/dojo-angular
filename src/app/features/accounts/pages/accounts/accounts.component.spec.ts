import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AccountsComponent } from './accounts.component';
import { Account } from '@accounts/models/account';
import { AccountsApiService } from '@accounts/services/accounts-api.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { NotificationService } from '@shared/services/notification.service';

const accounts: Account[] = [
  { id: 'a1', clientId: 'c1', label: 'Compte courant Ada', type: 'checking', status: 'active', balance: 100, currency: 'EUR', movements: [] },
  { id: 'a2', clientId: 'c1', label: 'Livret Ada', type: 'saving', status: 'blocked', balance: 250, currency: 'EUR', movements: [] },
];

describe('AccountsComponent', () => {
  let fixture: ComponentFixture<AccountsComponent>;
  let api: { getByClientId: jest.Mock; add: jest.Mock; update: jest.Mock; remove: jest.Mock };
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let confirm: { confirm: jest.Mock };
  let notifications: { success: jest.Mock; error: jest.Mock };

  async function settleAccounts(): Promise<void> {
    fixture.componentInstance.accounts();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 300));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    api = {
      getByClientId: jest.fn(() => of(accounts)),
      add: jest.fn((_clientId, account) => of({ id: 'a3', clientId: 'c1', balance: 0, currency: 'EUR', movements: [], ...account })),
      update: jest.fn((_clientId, account) => of({ ...accounts[0], ...account })),
      remove: jest.fn(() => of(undefined)),
    };
    paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'c1' }));
    confirm = { confirm: jest.fn(() => Promise.resolve(true)) };
    notifications = { success: jest.fn(), error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [AccountsComponent],
      providers: [
        { provide: AccountsApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$, queryParamMap: new BehaviorSubject(convertToParamMap({})) } },
        { provide: ConfirmService, useValue: confirm },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountsComponent);
    fixture.detectChanges();
  });

  it('loads accounts from the current client route', async () => {
    await settleAccounts();

    expect(api.getByClientId).toHaveBeenCalledWith('c1');
    expect(fixture.componentInstance.accounts()).toHaveLength(2);
    expect(fixture.componentInstance.totalBalance()).toBe(350);
    expect(fixture.componentInstance.blockedAccountsCount).toBe(1);
  });

  it('filters accounts by type', async () => {
    await settleAccounts();

    fixture.componentInstance.setTypeFilter('saving');
    await settleAccounts();

    expect(fixture.componentInstance.accounts().map((account) => account.id)).toEqual(['a2']);
  });

  it('exposes an error when accounts cannot be loaded', async () => {
    api.getByClientId.mockReturnValueOnce(throwError(() => new Error('Network error')));
    paramMap$.next(convertToParamMap({ id: 'c2' }));
    await settleAccounts();

    expect(fixture.componentInstance.accounts()).toEqual([]);
    expect(fixture.componentInstance.error()).toBe('Network error');
  });

  it('creates an account for the current client', async () => {
    await settleAccounts();

    fixture.componentInstance.startAdd();
    fixture.componentInstance.newAccount = { label: 'Compte pro', type: 'checking', status: 'active' };
    await fixture.componentInstance.saveAdd();

    expect(api.add).toHaveBeenCalledWith('c1', { label: 'Compte pro', type: 'checking', status: 'active' });
    expect(notifications.success).toHaveBeenCalledWith('Compte cree.');
  });

  it('updates an account for the current client', async () => {
    await settleAccounts();

    fixture.componentInstance.startEdit(accounts[0]);
    fixture.componentInstance.editAccount = { id: 'a1', label: 'Compte principal', type: 'checking', status: 'active' };
    await fixture.componentInstance.saveEdit();

    expect(api.update).toHaveBeenCalledWith('c1', { id: 'a1', label: 'Compte principal', type: 'checking', status: 'active' });
    expect(notifications.success).toHaveBeenCalledWith('Compte mis a jour.');
  });

  it('removes an account after confirmation', async () => {
    await settleAccounts();

    await fixture.componentInstance.deleteAccount(accounts[0]);

    expect(confirm.confirm).toHaveBeenCalled();
    expect(api.remove).toHaveBeenCalledWith('c1', 'a1');
    expect(notifications.success).toHaveBeenCalledWith('Compte supprime.');
  });
});
