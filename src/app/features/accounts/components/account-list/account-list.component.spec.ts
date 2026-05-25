import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Account, AccountUpdate } from '@accounts/models/account';
import { AccountListComponent } from './account-list.component';

const accounts: Account[] = [
  {
    id: 'a1',
    clientId: 'c1',
    label: 'Compte courant Ada',
    type: 'checking',
    status: 'active',
    balance: 120,
    currency: 'EUR',
    movements: [],
  },
];

describe('AccountListComponent', () => {
  let fixture: ComponentFixture<AccountListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountListComponent);
    fixture.componentRef.setInput('accounts', accounts);
    fixture.componentRef.setInput('clientId', 'c1');
    fixture.componentRef.setInput('editAccount', { id: '', label: '', type: 'checking', status: 'active' } satisfies AccountUpdate);
    fixture.detectChanges();
  });

  it('emits the edit output immediately and the selected output from the effect', async () => {
    const edited: Account[] = [];
    const selected: Account[] = [];

    const editSubscription = fixture.componentInstance.editRequested.subscribe((account) => edited.push(account));
    const selectedSubscription = fixture.componentInstance.selectedRequested.subscribe((account) => selected.push(account));

    fixture.componentInstance.requestEdit(accounts[0]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(edited).toEqual([accounts[0]]);
    expect(selected).toEqual([accounts[0]]);

    editSubscription.unsubscribe();
    selectedSubscription.unsubscribe();
  });
});
