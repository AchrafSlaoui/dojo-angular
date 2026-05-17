import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccountCardComponent } from './account-card.component';
import { Account } from '@accounts/models/account';

describe('AccountCardComponent', () => {
  let fixture: ComponentFixture<AccountCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountCardComponent);
  });

  it('renders account label, type and status', () => {
    const account: Account = {
      id: 'a1',
      clientId: 'c1',
      label: 'Compte courant Ada',
      type: 'checking',
      status: 'active',
      balance: 120,
      currency: 'EUR',
      movements: [],
    };

    fixture.componentRef.setInput('account', account);
    fixture.componentRef.setInput('clientId', 'c1');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Compte courant Ada');
    expect(text).toContain('Compte courant');
    expect(text).toContain('Actif');
  });
});
