import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new NotificationService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('clears a success notification after the configured timeout', () => {
    // Given a success notification scheduled to expire
    service.success('Saved', 1000);
    expect(service.notification()?.kind).toBe('success');
    expect(service.notification()?.message).toBe('Saved');

    // When the configured timeout elapses
    jest.advanceTimersByTime(1000);

    // Then the notification is removed
    expect(service.notification()).toBeNull();
  });

  it('clears the current notification and cancels the pending timeout', () => {
    // Given an info notification with a pending timeout
    service.info('Pending', 5000);

    // When the notification is cleared manually
    service.clear();
    expect(service.notification()).toBeNull();

    // Then the pending timeout no longer clears anything
    jest.advanceTimersByTime(5000);
    expect(service.notification()).toBeNull();
  });

  it('replaces an existing notification when a new error arrives', () => {
    // Given a success notification already enqueued
    service.success('First', 4000);

    // When an error notification is pushed before the timeout elapses
    service.error('Second', 2000);
    expect(service.notification()?.kind).toBe('error');

    // Then the service clears the error notification after its timeout
    jest.advanceTimersByTime(2000);
    expect(service.notification()).toBeNull();
  });
});
