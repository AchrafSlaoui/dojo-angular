import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NotificationComponent } from './notification.component';
import { NotificationService } from '@shared/services/notification.service';

describe('NotificationComponent', () => {
  let fixture: ComponentFixture<NotificationComponent>;
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NotificationComponent],
      providers: [NotificationService],
    });

    fixture = TestBed.createComponent(NotificationComponent);
    service = TestBed.inject(NotificationService);
  });

  it('renders the notification content provided by the service', () => {
    // Given the service publishes a notification
    service.success('Saved', 0);
    fixture.detectChanges();

    // When the template is queried for the notification banner
    const notif = fixture.debugElement.query(By.css('.notification'));
    // Then the banner includes the expected message
    expect(notif.nativeElement.textContent).toContain('Saved');
  });

  it('clears the notification when the close button is pressed', () => {
    // Given a notification is visible
    service.info('Later', 0);
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));

    // When the close control is activated
    button.triggerEventHandler('click', {});

    // Then the notification service state resets
    expect(service.notification()).toBeNull();
  });
});
