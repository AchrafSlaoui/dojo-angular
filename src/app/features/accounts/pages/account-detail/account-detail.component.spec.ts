import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AccountDetailComponent } from './account-detail.component';
import { Account } from '@accounts/models/account';
import { AccountsApiService } from '@accounts/services/accounts-api.service';
import { Movement } from '@accounts/models/movement';
import { ConfirmService } from '@shared/services/confirm.service';
import { NotificationService } from '@shared/services/notification.service';

const account: Account = {
  id: 'a1',
  clientId: 'c1',
  label: 'Compte courant Ada',
  type: 'checking',
  status: 'active',
  balance: 100,
  currency: 'EUR',
  movements: [
    { id: 'm1', date: '2024-01-10', type: 'credit', amount: 100, description: 'Salaire' },
    { id: 'm2', date: '2024-01-12', type: 'debit', amount: 25, description: 'Courses' },
  ],
};

describe('AccountDetailComponent', () => {
  let fixture: ComponentFixture<AccountDetailComponent>;
  let api: { getById: jest.Mock; addMovement: jest.Mock; updateMovement: jest.Mock; removeMovement: jest.Mock };
  let confirm: { confirm: jest.Mock };
  let notifications: { success: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    api = {
      getById: jest.fn(() => of(account)),
      addMovement: jest.fn((_clientId: string, _accountId: string, movement: Omit<Movement, 'id'>) =>
        of({ ...account, balance: movement.amount, movements: [{ id: 'm2', ...movement }] })
      ),
      updateMovement: jest.fn((_clientId: string, _accountId: string, movement: Movement) =>
        of({ ...account, balance: movement.amount, movements: [movement] })
      ),
      removeMovement: jest.fn(() =>
        of({ ...account, balance: 0, movements: [] })
      ),
    };
    confirm = { confirm: jest.fn(() => Promise.resolve(true)) };
    notifications = { success: jest.fn(), error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [AccountDetailComponent],
      providers: [
        { provide: AccountsApiService, useValue: api },
        { provide: ConfirmService, useValue: confirm },
        { provide: NotificationService, useValue: notifications },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ clientId: 'c1', accountId: 'a1' })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads account details and exposes movement count', () => {
    expect(api.getById).toHaveBeenCalledWith('c1', 'a1');
    expect(fixture.componentInstance.account()).toEqual(account);
    expect(fixture.componentInstance.movementCount()).toBe(2);
  });

  it('renders account movements', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Compte courant Ada');
    expect(text).toContain('Salaire');
  });

  it('filters movements by description and type', () => {
    fixture.componentInstance.setMovementSearch('courses');
    fixture.componentInstance.setMovementTypeFilter('debit');

    expect(fixture.componentInstance.filteredMovements().map((movement) => movement.id)).toEqual(['m2']);
  });

  it('adds a movement through the account API', async () => {
    fixture.componentInstance.newMovement = {
      date: '2024-01-11',
      type: 'debit',
      amount: 40,
      description: 'Courses',
    };

    await fixture.componentInstance.addMovement();
    fixture.detectChanges();

    expect(api.addMovement).toHaveBeenCalledWith('c1', 'a1', {
      date: '2024-01-11',
      type: 'debit',
      amount: 40,
      description: 'Courses',
    });
    expect(fixture.componentInstance.account()?.movements[0].description).toBe('Courses');
  });

  it('does not add a movement with a non-positive amount', async () => {
    fixture.componentInstance.newMovement = {
      date: '2024-01-11',
      type: 'debit',
      amount: 0,
      description: 'Invalid',
    };

    await fixture.componentInstance.addMovement();

    expect(api.addMovement).not.toHaveBeenCalled();
  });

  it('updates a movement through the account API', async () => {
    const movement: Movement = {
      id: 'm1',
      date: '2024-01-10',
      type: 'credit',
      amount: 150,
      description: 'Salaire ajuste',
    };

    await fixture.componentInstance.updateMovement(movement);
    fixture.detectChanges();

    expect(api.updateMovement).toHaveBeenCalledWith('c1', 'a1', movement);
    expect(fixture.componentInstance.account()?.movements).toEqual([movement]);
    expect(fixture.componentInstance.account()?.balance).toBe(150);
  });

  it('removes a movement through the account API', async () => {
    await fixture.componentInstance.deleteMovement('m1');
    fixture.detectChanges();

    expect(confirm.confirm).toHaveBeenCalled();
    expect(api.removeMovement).toHaveBeenCalledWith('c1', 'a1', 'm1');
    expect(fixture.componentInstance.account()?.movements).toEqual([]);
  });

  it('exposes an error when the account cannot be loaded', async () => {
    api.getById.mockReturnValueOnce(throwError(() => new Error('Network error')));
    const errorFixture = TestBed.createComponent(AccountDetailComponent);
    errorFixture.detectChanges();
    await errorFixture.whenStable();
    errorFixture.detectChanges();

    expect(errorFixture.componentInstance.account()).toBeNull();
    expect(errorFixture.componentInstance.error()).toBe('Network error');
  });
});
