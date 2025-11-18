import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmService } from '@shared/services/confirm.service';

class NotificationServiceStub {
  notification = signal(null);
  clear = jest.fn();
  success = jest.fn();
  error = jest.fn();
  info = jest.fn();
}

class ConfirmServiceStub {
  state = signal({
    title: 'Confirmation',
    message: '',
    confirmLabel: 'Confirmer',
    cancelLabel: 'Annuler',
    visible: false,
  });
  confirm = jest.fn();
  accept = jest.fn();
  cancel = jest.fn();
}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [
        { provide: NotificationService, useClass: NotificationServiceStub },
        { provide: ConfirmService, useClass: ConfirmServiceStub },
      ],
    });

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('instantiates the application component', () => {
    // Given the application component fixture is initialized
    // When no additional interactions occur
    // Then the hosted component instance exists
    expect(component).toBeTruthy();
  });

  it('exposes the configured application title', () => {
    // Given the component is initialized
    // When the title getter is read
    // Then it returns the expected application name
    expect(component.title).toBe('dojo-bank');
  });

  it('renders the primary navigation links', () => {
    // Given the component template is rendered
    const compiled = fixture.nativeElement as HTMLElement;
    // When the navigation anchors are inspected
    const links = Array.from(compiled.querySelectorAll('nav a')).map((anchor) =>
      anchor.textContent?.trim()
    );
    // Then the expected navigation entries are present
    expect(links).toEqual(expect.arrayContaining(['Dashboard', 'Tous les clients']));
  });
});
