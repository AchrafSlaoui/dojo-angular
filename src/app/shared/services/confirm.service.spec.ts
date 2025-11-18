import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    service = new ConfirmService();
  });

  it('resolves true when the confirmation is accepted', async () => {
    // Given a confirmation request is initiated
    const promise = service.confirm({ message: 'Remove item?' });
    expect(service.state().visible).toBe(true);

    // When the user accepts the dialog
    service.accept();

    // Then the promise resolves to true and the dialog closes
    await expect(promise).resolves.toBe(true);
    expect(service.state().visible).toBe(false);
  });

  it('resolves false when the confirmation is cancelled', async () => {
    // Given a pending confirmation dialog
    const promise = service.confirm({ message: 'Cancel me' });

    // When the user cancels the dialog
    service.cancel();

    // Then the promise resolves to false and the dialog hides
    await expect(promise).resolves.toBe(false);
    expect(service.state().visible).toBe(false);
  });

  it('cancels the previous dialog when a new one is requested', async () => {
    // Given two confirmation requests arriving in sequence
    const first = service.confirm({ message: 'First' });
    const second = service.confirm({ message: 'Second' });

    // When the second dialog replaces the first
    await expect(first).resolves.toBe(false);

    // Then accepting confirms the second dialog only
    service.accept();
    await expect(second).resolves.toBe(true);
  });
});
