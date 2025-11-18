import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClientCardComponent } from './client-card.component';
import { Client } from '@app/models/client';

describe('ClientCardComponent', () => {
  let fixture: ComponentFixture<ClientCardComponent>;
  let component: ClientCardComponent;

  const client: Client = {
    id: '1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '0612345678',
    address: 'London',
    movements: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClientCardComponent],
    });

    fixture = TestBed.createComponent(ClientCardComponent);
    component = fixture.componentInstance;
  });

  it('displays basic client information', () => {
    // Given the component receives a client input
    fixture.componentRef.setInput('client', client);
    fixture.detectChanges();

    // When the template is queried for contact details
    const fullName = fixture.debugElement.query(By.css('.name')).nativeElement.textContent;
    const email = fixture.debugElement.query(By.css('.contact')).nativeElement.textContent;
    // Then the rendered content reflects the client data
    expect(fullName).toContain('Ada');
    expect(fullName).toContain('LOVELACE');
    expect(email).toContain('ada@example.com');
  });

  it('switches to edit mode when the edit button is activated', () => {
    // Given an editable client card
    fixture.componentRef.setInput('client', client);
    fixture.componentRef.setInput('editable', true);
    fixture.detectChanges();

    // When the edit button is clicked
    const editButton = fixture.debugElement.query(By.css('button[title="Modifier le client"]'));
    editButton.triggerEventHandler('click', { stopPropagation: () => undefined });
    fixture.detectChanges();

    // Then the component shows the edit form
    expect(component.editMode).toBe(true);
    const inputs = fixture.debugElement.queryAll(By.css('input'));
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('emits sanitized values when the edit form is saved', () => {
    // Given the component is in edit mode with user changes
    fixture.componentRef.setInput('client', client);
    fixture.componentRef.setInput('editable', true);
    fixture.detectChanges();

    const saveSpy = jest.fn();
    component.saveRequested.subscribe(saveSpy);

    component.startEdit();
    component.editModel = {
      id: '1',
      firstName: '  Grace ',
      lastName: ' Hopper  ',
      email: 'grace@example.com',
      phone: '0700000000',
      address: 'Arlington',
    };

    // When the save action is triggered
    component.saveEdit();

    // Then the emitted payload is trimmed and edit mode closes
    expect(saveSpy).toHaveBeenCalledWith({
      id: '1',
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      phone: '0700000000',
      address: 'Arlington',
    });
    expect(component.editMode).toBe(false);
  });
});
