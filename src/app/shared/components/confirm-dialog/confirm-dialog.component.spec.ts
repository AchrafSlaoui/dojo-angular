import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmService } from '@shared/services/confirm.service';
import { By } from '@angular/platform-browser';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let service: ConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [ConfirmService],
    });

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    service = TestBed.inject(ConfirmService);
  });

  it('keeps the dialog hidden by default', () => {
    // Given the component is initialised without a confirmation request
    fixture.detectChanges();

    // When the template is inspected
    // Then the dialog remains hidden
    expect(fixture.debugElement.query(By.css('.dialog'))).toBeNull();
  });

  it('displays the dialog content once a confirmation is requested', async () => {
    // Given a confirmation request is issued through the service
    const promise = service.confirm({ message: 'Proceed?', title: 'Confirm' });
    fixture.detectChanges();

    // When the template is queried for the dialog
    const dialog = fixture.debugElement.query(By.css('.dialog'));
    expect(dialog).not.toBeNull();
    expect(dialog.nativeElement.textContent).toContain('Proceed?');

    // Then cancelling the confirmation resolves the promise
    service.cancel();
    await expect(promise).resolves.toBe(false);
  });

  it('confirms the action when the primary button is clicked', async () => {
    // Given a pending confirmation request
    const acceptSpy = jest.spyOn(service, 'accept');
    const promise = service.confirm({ message: 'Continue' });
    fixture.detectChanges();

    // When the confirm button is clicked
    const confirmButton = fixture.debugElement.query(By.css('.primary'));
    confirmButton.triggerEventHandler('click', {});

    // Then the service accept handler is invoked
    expect(acceptSpy).toHaveBeenCalled();

    await promise;
  });
});
